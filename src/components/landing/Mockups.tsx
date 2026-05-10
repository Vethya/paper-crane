import { Check, Sparkles } from 'lucide-react'
import { Logo } from '@/components/core/Logo'

const sidebarItems = [
  'Templates',
  'Profile',
  'Education',
  'Work Experience',
  'Skills',
  'Projects',
  'Awards'
]

export function ProductMockup() {
  return (
    <div className="relative rounded-lg border border-[#cbd5e1] bg-[#ffffff] p-3 shadow-2xl shadow-slate-300/45">
      <div className="mb-3 flex h-10 items-center justify-between border-b border-[#e2e8f0] px-2">
        <Logo scale={0.62} />
        <div className="flex items-center gap-2 text-[10px] text-[#64748b]">
          <span>Saved</span>
          <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2 py-1 font-semibold text-[#1d4ed8]">
            JD
          </span>
        </div>
      </div>

      <div className="grid h-[520px] gap-3 overflow-hidden lg:grid-cols-[0.48fr_0.92fr_1.22fr]">
        <aside className="hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 md:block">
          {sidebarItems.map((item, index) => (
            <div
              key={item}
              className={`mb-2 rounded-md border px-2.5 py-2 text-[10px] font-medium leading-tight ${
                index === 3
                  ? 'border-[#bfdbfe] bg-[#dbeafe] text-[#1d4ed8]'
                  : 'border-transparent text-[#64748b]'
              }`}
            >
              {item}
            </div>
          ))}
          <div className="mt-5 rounded-lg border border-[#2563eb] bg-[#2563eb] px-3 py-2 text-center text-[10px] font-semibold text-[#ffffff]">
            MAKE
          </div>
        </aside>

        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <div className="border-b border-[#e2e8f0] pb-3 text-sm font-semibold text-[#0f172a]">
            Your Work Experience
          </div>
          <div className="mt-4">
            <Field label="Section Heading" value="Work" />
            <div className="rounded-lg border border-[#cbd5e1] bg-[#ffffff] p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#0f172a]">
                    Northstar Labs
                  </div>
                  <div className="mt-1 text-[10px] text-[#64748b]">
                    Product Engineer - Remote
                  </div>
                </div>
                <span className="text-[#64748b]">⌄</span>
              </div>
              <Field label="Company name" value="Northstar Labs" />
              <Field label="Position" value="Product Engineer" />
              <Field label="Start Date" value="Sep 2021" />
              <div className="mt-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="mb-2 text-[10px] text-[#0f172a]">
                  Job Responsibilities
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 rounded-full bg-[#94a3b8]" />
                  <div className="h-1.5 w-11/12 rounded-full bg-[#cbd5e1]" />
                  <div className="h-1.5 w-4/5 rounded-full bg-[#cbd5e1]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
          <PreviewToolbar />
          <div className="flex flex-1 items-start justify-center overflow-hidden bg-[#f8fafc] p-5">
            <ResumeSheet />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-xs font-medium text-[#1d4ed8] shadow-xl shadow-blue-200/60">
        <Sparkles size={14} />
        Resume Agent
      </div>
    </div>
  )
}

export function EditorPreview() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.86fr]">
      <div className="rounded-lg border border-[#cbd5e1] bg-[#ffffff] p-3 shadow-xl shadow-slate-300/35">
        <div className="grid gap-3 md:h-[420px] md:grid-cols-[0.55fr_1fr]">
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <div className="mb-3 text-sm font-semibold text-[#0f172a]">
              Your personal info
            </div>
            <Field label="Full name" value="Jordan Diaz" />
            <Field label="Email" value="jordan@example.com" />
            <Field label="Location" value="Seattle, WA" />
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <div className="mb-2 text-xs font-semibold text-amber-800">
                AI edit pending
              </div>
              <p className="text-[11px] leading-5 text-amber-900/80">
                Reposition summary toward frontend platform work.
              </p>
              <div className="mt-3 flex gap-2">
                <span
                  className="rounded-md bg-[#2563eb] px-2 py-1 text-[10px] font-semibold"
                  style={{ color: '#ffffff' }}
                >
                  Accept
                </span>
                <span className="rounded-md border border-amber-300 px-2 py-1 text-[10px] text-amber-900">
                  Reject
                </span>
              </div>
            </div>
          </div>

          <div className="flex min-h-[360px] flex-col rounded-lg border border-[#e2e8f0] bg-[#f8fafc] md:min-h-0">
            <div className="border-b border-[#e2e8f0] px-4 py-3 text-sm font-medium tracking-wide text-[#64748b]">
              Live Preview
            </div>
            <div className="grid grid-cols-[1.1fr_0.9fr_0.9fr] items-center gap-2 border-b border-[#e2e8f0] bg-[#ffffff] px-3 py-2 text-[9px] text-[#475569]">
              <span className="min-w-0 truncate whitespace-nowrap">
                PDF · LaTeX
              </span>
              <span className="min-w-0 truncate whitespace-nowrap text-center">
                Page 1 / 1
              </span>
              <span className="min-w-0 truncate whitespace-nowrap text-right">
                Zoom · Print
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center bg-[#eef2f7] p-5">
              <ResumeSheet compact />
            </div>
          </div>
        </div>
      </div>

      <AgentOverlayMockup />
    </div>
  )
}

export function TemplateCard({ name }: { name: string }) {
  return (
    <article className="rounded-lg border border-[#e2e8f0] bg-[#ffffff] p-4 shadow-sm shadow-slate-200/70">
      <div className="rounded-md bg-[#f1f5f9] p-4">
        <div className="mx-auto aspect-[210/297] w-full max-w-[245px] overflow-hidden border border-[#e2e8f0] bg-[#ffffff] shadow-sm">
          {name === 'Classic' && <ClassicTemplateMockup />}
          {name === 'Technical' && <TechnicalTemplateMockup />}
          {name === 'Compact' && <CompactTemplateMockup />}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <h3 className="font-semibold text-[#0f172a]">{name}</h3>
        <span className="inline-flex items-center gap-1 rounded-md bg-[#ecfdf5] px-2 py-1 text-xs font-medium text-[#047857]">
          <Check size={13} strokeWidth={2.5} />
          ATS-ready
        </span>
      </div>
    </article>
  )
}

function PreviewToolbar() {
  return (
    <>
      <div className="border-b border-[#e2e8f0] px-4 py-3 text-sm font-medium tracking-wide text-[#64748b]">
        Live Preview
      </div>
      <div className="grid grid-cols-3 border-b border-[#e2e8f0] bg-[#ffffff] px-3 py-2 text-[10px] text-[#475569]">
        <span>↓ PDF</span>
        <span className="text-center">Page 1 / 1</span>
        <span className="text-right">− + Print</span>
      </div>
    </>
  )
}

function ResumeSheet({ compact = false }: { compact?: boolean }) {
  const sections = compact
    ? ['Experience', 'Skills']
    : ['Experience', 'Skills', 'Projects']

  return (
    <div
      className={`overflow-hidden border border-[#e2e8f0] bg-[#ffffff] text-[#111827] shadow-xl shadow-black/10 ${
        compact
          ? 'aspect-[210/297] h-auto w-full max-w-[240px] p-4 sm:max-w-[270px] md:max-w-[230px] xl:max-w-[270px]'
          : 'h-[390px] w-[275px] p-5'
      }`}
    >
      <div className="text-center">
        <div
          className={`mx-auto rounded-full bg-[#111827] ${
            compact ? 'h-2.5 w-24' : 'h-3 w-28'
          }`}
        />
        <div
          className={`mx-auto mt-2 rounded-full bg-slate-300 ${
            compact ? 'h-1.5 w-32' : 'h-1.5 w-40'
          }`}
        />
      </div>
      <div className={compact ? 'mt-5 space-y-3' : 'mt-6 space-y-4'}>
        {sections.map((section, index) => (
          <div key={section}>
            <div
              className={`mb-2 h-1.5 rounded-full ${
                index === 0 ? 'w-20 bg-[#2563eb]' : 'w-16 bg-[#111827]'
              }`}
            />
            <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
              <div className="h-1.5 rounded-full bg-slate-300" />
              <div className="h-1.5 w-11/12 rounded-full bg-slate-300" />
              <div className="h-1.5 w-4/5 rounded-full bg-slate-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-[#64748b]">
        {label}
      </div>
      <div className="rounded-md border border-[#cbd5e1] bg-[#ffffff] px-3 py-2 text-xs text-[#334155]">
        {value}
      </div>
    </div>
  )
}

function AgentOverlayMockup() {
  return (
    <div className="min-w-[250px] rounded-lg border border-[#cbd5e1] bg-[#ffffff] p-4 shadow-xl shadow-slate-300/35">
      <div className="mx-auto flex h-[430px] max-w-md flex-col rounded-lg border border-[#e2e8f0] bg-[#ffffff]">
        <div className="flex h-14 items-center justify-between px-4">
          <button className="rounded-lg px-3 py-1.5 text-xs text-[#475569]">
            History
          </button>
          <div className="flex gap-2 text-[#64748b]">
            <span className="rounded-md border border-[#e2e8f0] px-2 py-1 text-xs">
              ✎
            </span>
            <span className="rounded-md border border-[#e2e8f0] px-2 py-1 text-xs">
              ×
            </span>
          </div>
        </div>
        <div className="mx-4 border-b border-[#e2e8f0]" />

        <div className="flex flex-1 flex-col gap-3 overflow-hidden px-5 py-4 text-sm">
          <div className="max-w-full rounded-lg rounded-bl-sm border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 leading-6 text-[#1e3a8a]">
            I’ve reviewed your resume. How can I help you?
          </div>
          <div className="ml-auto max-w-[92%] rounded-lg rounded-br-sm border border-[#cbd5e1] bg-[#ffffff] px-4 py-2.5 text-xs font-medium leading-5 text-[#334155] shadow-sm">
            Tailor this resume for a senior frontend role.
          </div>
          <div className="max-w-full rounded-lg rounded-bl-sm border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-[#1e3a8a]">
            <p className="text-xs font-semibold">Suggested focus</p>
            <div className="mt-3 space-y-2">
              <div className="h-1.5 w-11/12 rounded-full bg-[#93c5fd]" />
              <div className="h-1.5 w-4/5 rounded-full bg-[#bfdbfe]" />
              <div className="h-1.5 w-2/3 rounded-full bg-[#bfdbfe]" />
            </div>
          </div>
        </div>

        <div className="mx-4 border-t border-[#e2e8f0]" />
        <div className="p-4">
          <div className="rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex min-w-0 flex-1 rounded-lg border border-[#cbd5e1] bg-[#ffffff] px-3 py-2 text-xs font-medium text-[#0f172a]">
                Tailoring
              </span>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb]"
                style={{ color: '#ffffff' }}
              >
                ↑
              </span>
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] text-[#64748b]">
            Chat · Feedback · Tailoring
          </p>
        </div>
      </div>
    </div>
  )
}

function ClassicTemplateMockup() {
  return (
    <div className="h-full p-5 font-serif">
      <div className="flex items-start justify-between">
        <div className="h-1.5 w-14 rounded-full bg-[#cbd5e1]" />
        <div className="text-center">
          <div className="mx-auto h-3 w-24 rounded-full bg-[#111827]" />
          <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[#cbd5e1]" />
        </div>
        <div className="h-1.5 w-14 rounded-full bg-[#cbd5e1]" />
      </div>

      <div className="mt-6 space-y-4">
        {['w-full', 'w-[92%]', 'w-[82%]', 'w-[70%]'].map((width, index) => (
          <div key={width}>
            <div className="flex items-end gap-2">
              <div className="h-2 w-16 rounded-full bg-[#111827]" />
              <div className="h-px flex-1 bg-[#94a3b8]" />
            </div>
            <div className="mt-2 grid grid-cols-[0.38fr_1fr_0.5fr] gap-3">
              <div className="space-y-1">
                <div className="h-1.5 w-11 rounded-full bg-[#334155]" />
                <div className="h-1 w-9 rounded-full bg-[#cbd5e1]" />
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-16 rounded-full bg-[#334155]" />
                <div className={`h-1 rounded-full bg-[#cbd5e1] ${width}`} />
                <div className="h-1 w-10/12 rounded-full bg-[#cbd5e1]" />
              </div>
              <div className="h-1.5 rounded-full bg-[#334155]" />
            </div>
            {index === 3 && (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#cbd5e1] pt-2">
                <div className="h-1.5 rounded-full bg-[#cbd5e1]" />
                <div className="h-1.5 rounded-full bg-[#cbd5e1]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TechnicalTemplateMockup() {
  return (
    <div className="h-full p-5 font-sans">
      <div className="ml-auto text-right">
        <div className="ml-auto h-4 w-[42%] rounded-sm bg-[#111827]" />
        <div className="ml-auto mt-2 h-1.5 w-[49%] rounded-full bg-[#cbd5e1]" />
      </div>

      <div className="mt-6 space-y-3">
        {[
          ['68%', '76%', '100%', '78%', '88%'],
          ['68%', '76%', '100%', '78%', '88%'],
          ['68%', '52%', '100%', '78%', '0%']
        ].map(
          ([headingWidth, titleWidth, lineOne, lineTwo, lineThree], index) => (
            <div key={`${headingWidth}-${index}`}>
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 rounded-sm bg-[#111827]"
                  style={{ width: headingWidth }}
                />
                <div className="h-0.5 flex-1 bg-[#111827]" />
              </div>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_24%] gap-3">
                <div className="min-w-0">
                  <div
                    className="h-2 rounded-sm bg-[#111827]"
                    style={{ width: titleWidth }}
                  />
                  <div className="mt-1 h-1.5 w-[72%] rounded-sm bg-[#64748b]" />
                  <div className="mt-2 space-y-1">
                    <div
                      className="h-1.5 rounded-full bg-[#cbd5e1]"
                      style={{ width: lineOne }}
                    />
                    <div
                      className="h-1.5 rounded-full bg-[#cbd5e1]"
                      style={{ width: lineTwo }}
                    />
                    {lineThree !== '0%' && (
                      <div
                        className="h-1.5 rounded-full bg-[#cbd5e1]"
                        style={{ width: lineThree }}
                      />
                    )}
                  </div>
                </div>
                <div className="ml-auto h-4 w-full rounded-sm bg-[#111827]" />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

function CompactTemplateMockup() {
  return (
    <div className="h-full p-5 font-sans">
      <div className="text-right">
        <div className="ml-auto h-5 w-28 rounded-sm bg-[#111827]" />
        <div className="ml-auto mt-2 h-1.5 w-36 rounded-full bg-[#cbd5e1]" />
      </div>

      <div className="mt-5 space-y-2.5">
        {['EXPERIENCE', 'SKILLS', 'PROJECTS', 'AWARDS'].map(
          (section, index) => (
            <div key={section}>
              <div className="h-2.5 w-20 rounded-sm bg-[#111827]" />
              <div className="mt-1 h-0.5 w-full bg-[#111827]" />
              <div className="mt-2 space-y-1.5">
                {Array.from({ length: index === 0 ? 3 : 1 }).map((_, row) => (
                  <div
                    key={row}
                    className="grid grid-cols-[0.16fr_1fr_0.22fr] gap-2"
                  >
                    <div className="mt-1 h-1 w-3 rounded-sm bg-[#111827]" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-24 rounded-full bg-[#334155]" />
                      <div className="h-1 w-full rounded-full bg-[#cbd5e1]" />
                      {index < 2 && (
                        <div className="h-1 w-9/12 rounded-full bg-[#cbd5e1]" />
                      )}
                    </div>
                    <div className="h-1.5 rounded-full bg-[#64748b]" />
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
