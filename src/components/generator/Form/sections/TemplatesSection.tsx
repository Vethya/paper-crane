import Image from 'next/image'
import { useFormContext, Controller } from 'react-hook-form'
import clsx from 'clsx'

import { FormSection } from './FormSection'
import { TEMPLATES } from '../../../../lib/templates/constants'

import { FormValues } from '../../../../types'

export function TemplatesSection() {
  const { control } = useFormContext<FormValues>()

  return (
    <FormSection title="Choose a Template">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEMPLATES.map((templateId) => (
          <Controller
            key={templateId}
            control={control}
            name="selectedTemplate"
            render={({ field }) => (
              <label className="cursor-pointer">
                <input
                  type="radio"
                  className="sr-only"
                  onChange={() => field.onChange(templateId)}
                  value={templateId}
                  checked={field.value === templateId}
                />
                <div
                  className={clsx(
                    'border-2 rounded overflow-hidden',
                    field.value === templateId
                      ? 'border-primary'
                      : 'border-transparent'
                  )}
                >
                  <Image
                    src={`/templates/previews/template${templateId}.png`}
                    alt={`Template ${templateId}`}
                    width={400}
                    height={560}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  <div className="bg-[#1e232d] text-white text-center py-3 text-sm tracking-wider">
                    Template {templateId}
                  </div>
                </div>
              </label>
            )}
          />
        ))}
      </div>
    </FormSection>
  )
}
