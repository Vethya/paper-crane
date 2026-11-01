import { FormSection } from './FormSection'
import { LabeledInput } from '../../../core/LabeledInput'

export function ProfileSection() {
  return (
    <FormSection title="Your personal info">
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <LabeledInput
          name="basics.name"
          label="Full name"
          placeholder="John Smith"
          className="col-span-2 mb-0"
        />
        <LabeledInput
          name="basics.email"
          className="mb-0"
          label="Email"
          placeholder="johnsmith@gmail.com"
        />
        <LabeledInput
          name="basics.phone"
          className="mb-0"
          label="Phone number"
          placeholder="(555) 464-6446"
        />
        <LabeledInput
          name="basics.location.address"
          className="mb-0"
          label="Location"
          placeholder="Seattle, WA"
        />
        <LabeledInput
          name="basics.website"
          label="Website"
          placeholder="mycoolportifolio.com/myname"
          className="mb-0"
        />
      </div>
    </FormSection>
  )
}
