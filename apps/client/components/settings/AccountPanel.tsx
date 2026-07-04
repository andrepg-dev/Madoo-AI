"use client";

import { getMe, updateMe, uploadAvatar } from "@/actions/auth";
import { BillingPanel } from "@/components/settings/BillingPanel";
import { ReferralPanel } from "@/components/settings/ReferralPanel";
import {
  playCompletionSound,
  readSoundPref,
  saveSoundPref,
  type SoundPref,
} from "@/lib/storage";
import { useAuthStore } from "@/stores/auth-store";
import {
  Avatar,
  Button,
  Checkbox,
  Input,
  SegmentedControl,
  useToast,
} from "@madoo/design-system";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { AccountSection } from "./settings-ui";
import { getErrorMessage, SettingsCard } from "./settings-ui";

export function AccountPanel({ section }: { section: AccountSection }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const setAuthUser = useAuthStore((state) => state.setUser);
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
  });
  const [name, setName] = useState("");
  const [sound, setSound] = useState<SoundPref>("soft");

  useEffect(() => {
    if (user) setName(user.name ?? "");
  }, [user]);

  useEffect(() => {
    setSound(readSoundPref());
  }, []);

  const profileMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      setAuthUser(updated);
      toast({ tone: "success", title: "Profile saved" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Profile save failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      setAuthUser(updated);
      toast({ tone: "success", title: "Avatar updated" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Avatar upload failed",
        body: getErrorMessage(error, "Use a PNG or JPEG under 4 MB."),
      });
    },
  });

  if (section === "billing") {
    return <BillingPanel />;
  }

  if (section === "referral") {
    return <ReferralPanel />;
  }

  if (section === "sound") {
    const saveSound = (next: SoundPref) => {
      setSound(next);
      saveSoundPref(next);
    };

    return (
      <SettingsCard>
        <div className="grid gap-4">
          <SegmentedControl
            aria-label="Completion sound"
            value={sound}
            onChange={(value) => saveSound(value as SoundPref)}
            items={[
              { value: "soft", label: "Soft" },
              { value: "bright", label: "Bright" },
              { value: "silent", label: "Silent" },
            ]}
          />
          <Checkbox
            checked={sound !== "silent"}
            label="Play sound after email generation"
            description="Stored locally on this device."
            onChange={(event) =>
              saveSound(event.currentTarget.checked ? "soft" : "silent")
            }
          />
          <Button
            size="md"
            variant="secondary"
            className="w-max"
            disabled={sound === "silent"}
            onClick={playCompletionSound}
          >
            Test sound
          </Button>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard>
      <div className="grid max-w-xl gap-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={user?.name ?? user?.email ?? "User"}
            src={user?.avatarUrl ?? undefined}
            size="xl"
            circle
            tone="ink"
          />
          <div className="min-w-0">
            <p className="text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
              {isLoading ? "Loading..." : user?.name || "Unnamed user"}
            </p>
            <p className="mt-1 text-(length:--font-size-sm) leading-none text-madoo-ink-muted">
              {user?.email ?? ""}
            </p>
          </div>
        </div>
        <Input
          label="Username"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Input label="Email" value={user?.email ?? ""} disabled readOnly />
        <div className="flex flex-wrap gap-2">
          <Button
            size="md"
            disabled={!name.trim() || profileMutation.isPending}
            onClick={() => profileMutation.mutate({ name: name.trim() })}
          >
            Save profile
          </Button>
          <label className="inline-flex">
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.set("file", file);
                avatarMutation.mutate(formData);
                event.currentTarget.value = "";
              }}
            />
            <span className="inline-flex cursor-pointer items-center rounded-lg bg-madoo-surface px-3.5 py-2 font-madoo-sans text-[13.5px] font-medium leading-none text-madoo-ink shadow-madoo-border transition-colors hover:bg-madoo-bg">
              {avatarMutation.isPending ? "Uploading..." : "Upload avatar"}
            </span>
          </label>
        </div>
      </div>
    </SettingsCard>
  );
}
