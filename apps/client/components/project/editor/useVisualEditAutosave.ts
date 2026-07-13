import type { EmailDto, VisualEditOp } from "@madoo/shared";
import { useCallback, useEffect, useRef, useState } from "react";

const SAVE_IDLE_MS = 500;

type SaveSession = {
  baseVariantId: string;
  emailId: string;
  lastChangedAt: number;
  ops: VisualEditOp[];
  revision: number;
  saving: boolean;
  timer: number | null;
};

type VisualEditAutosaveOptions = {
  baseVariantId: string | null;
  emailId: string | null;
  onError: (error: unknown) => void;
  onSaved: (emailId: string, email: EmailDto) => void;
  save: (
    emailId: string,
    baseVariantId: string,
    ops: VisualEditOp[],
  ) => Promise<EmailDto>;
};

/**
 * Keeps one stable node-id base while edits happen. Every request carries the
 * full session op list, so edits added during an in-flight save cannot branch
 * from an old variant or overwrite newer local work.
 */
export function useVisualEditAutosave({
  baseVariantId,
  emailId,
  onError,
  onSaved,
  save,
}: VisualEditAutosaveOptions) {
  const [saving, setSaving] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const sessionRef = useRef<SaveSession | null>(null);
  const mountedRef = useRef(true);
  const saveRef = useRef(save);
  const onSavedRef = useRef(onSaved);
  const onErrorRef = useRef(onError);
  const scheduleRef = useRef<(session: SaveSession) => void>(() => undefined);
  saveRef.current = save;
  onSavedRef.current = onSaved;
  onErrorRef.current = onError;

  const persist = useCallback(async (session: SaveSession) => {
    if (session.saving || session.ops.length === 0) return;
    session.saving = true;
    session.timer = null;
    if (mountedRef.current) setSaving(true);

    const savedRevision = session.revision;
    const savedOps = [...session.ops];
    try {
      const email = await saveRef.current(
        session.emailId,
        session.baseVariantId,
        savedOps,
      );
      if (sessionRef.current !== session) return;

      if (session.revision !== savedRevision) {
        session.saving = false;
        scheduleRef.current(session);
        return;
      }

      sessionRef.current = null;
      if (mountedRef.current) setSaving(false);
      onSavedRef.current(session.emailId, email);
    } catch (error) {
      if (sessionRef.current !== session) return;
      sessionRef.current = null;
      if (mountedRef.current) {
        setSaving(false);
        setResetVersion((version) => version + 1);
      }
      onErrorRef.current(error);
    }
  }, []);

  const schedule = useCallback(
    (session: SaveSession) => {
      if (session.timer !== null) window.clearTimeout(session.timer);
      const elapsed = Date.now() - session.lastChangedAt;
      session.timer = window.setTimeout(
        () => void persist(session),
        Math.max(0, SAVE_IDLE_MS - elapsed),
      );
    },
    [persist],
  );
  scheduleRef.current = schedule;

  const enqueue = useCallback(
    (ops: VisualEditOp[]) => {
      if (!emailId || !baseVariantId || ops.length === 0) return;
      let session = sessionRef.current;
      if (
        !session ||
        session.emailId !== emailId ||
        session.baseVariantId !== baseVariantId
      ) {
        session = {
          baseVariantId,
          emailId,
          lastChangedAt: Date.now(),
          ops: [],
          revision: 0,
          saving: false,
          timer: null,
        };
        sessionRef.current = session;
      }

      session.ops.push(...ops);
      session.revision += 1;
      session.lastChangedAt = Date.now();
      setSaving(true);
      schedule(session);
    },
    [baseVariantId, emailId, schedule],
  );

  const flush = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.saving) return;
    if (session.timer !== null) window.clearTimeout(session.timer);
    session.timer = null;
    void persist(session);
  }, [persist]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const session = sessionRef.current;
      if (!session || session.saving || session.ops.length === 0) return;
      if (session.timer !== null) window.clearTimeout(session.timer);
      sessionRef.current = null;
      void saveRef
        .current(session.emailId, session.baseVariantId, [...session.ops])
        .then((email) => onSavedRef.current(session.emailId, email))
        .catch(onErrorRef.current);
    };
  }, []);

  return { enqueue, flush, resetVersion, saving };
}
