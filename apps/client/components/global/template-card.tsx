import { Icon } from "@madoo/design-system";

export default function TemplateCard({ project }: { project: { title: string } }) {
  return (
    <article className="min-w-0">
      <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.16)]">
        <Icon name="image" size={32} className="text-[#f2f0ea]" />
      </div>

      <div className="mt-2.5 grid grid-cols-[28px_minmax(0,1fr)] items-start gap-1.5">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#7224aa] text-sm text-white">
          A
        </span>
        <div className="min-w-0">
          <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[1.2] text-[#101114]">
            {project.title}
          </h3>
        </div>
      </div>
    </article>
  )
}
