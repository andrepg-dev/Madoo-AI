"use client";

import { cx } from "@madoo/design-system";
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";

type MasonryGridProps<T> = {
  className?: string;
  columnClassName?: string;
  getWeight?: (item: T, index: number) => number;
  items: T[];
  maxColumns?: number;
  renderItem: (item: T, index: number) => ReactNode;
  responsiveClassName?: string;
};

function requestedColumnCount(maxColumns: number) {
  if (window.matchMedia("(min-width: 1280px)").matches) return maxColumns;
  if (window.matchMedia("(min-width: 1024px)").matches) {
    return Math.min(maxColumns, 3);
  }
  return 0;
}

function useResponsiveColumnCount(maxColumns: number) {
  const [columnCount, setColumnCount] = useState(0);

  useEffect(() => {
    const queries = [
      window.matchMedia("(min-width: 1280px)"),
      window.matchMedia("(min-width: 1024px)"),
    ];

    const updateColumnCount = () => {
      const requested = requestedColumnCount(maxColumns);
      if (requested === 0) {
        setColumnCount(0);
        return;
      }

      setColumnCount(Math.max(1, Math.min(maxColumns, requested)));
    };

    updateColumnCount();
    queries.forEach((query) =>
      query.addEventListener("change", updateColumnCount),
    );

    return () => {
      queries.forEach((query) =>
        query.removeEventListener("change", updateColumnCount),
      );
    };
  }, [maxColumns]);

  return columnCount;
}

function buildMasonryColumns<T>(
  items: T[],
  columnCount: number,
  getWeight: (item: T, index: number) => number,
) {
  const columns = Array.from({ length: Math.max(1, columnCount) }, () => ({
    entries: [] as Array<{ index: number; item: T }>,
    weight: 0,
  }));

  items.forEach((item, index) => {
    const target = columns.reduce((shortest, column) =>
      column.weight < shortest.weight ? column : shortest,
    );
    target.entries.push({ index, item });
    target.weight += Math.max(1, getWeight(item, index));
  });

  return columns;
}

export function MasonryGrid<T>({
  className,
  columnClassName,
  getWeight = () => 1,
  items,
  maxColumns = 5,
  renderItem,
  responsiveClassName,
}: MasonryGridProps<T>) {
  const columnCount = useResponsiveColumnCount(maxColumns);
  const columns = useMemo(
    () =>
      columnCount > 0 ? buildMasonryColumns(items, columnCount, getWeight) : [],
    [columnCount, getWeight, items],
  );

  if (items.length === 0) return null;

  if (columnCount === 0) {
    return (
      <div className={cx("grid gap-4 grid-cols-2", responsiveClassName)}>
        {items.map((item, index) => (
          <Fragment key={index}>{renderItem(item, index)}</Fragment>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cx("grid gap-4", className)}
      style={{
        gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
      }}
    >
      {columns.map((column, columnIndex) => (
        <div
          className={cx("flex min-w-0 flex-col gap-4", columnClassName)}
          key={columnIndex}
        >
          {column.entries.map(({ item, index }) => (
            <Fragment key={index}>{renderItem(item, index)}</Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
