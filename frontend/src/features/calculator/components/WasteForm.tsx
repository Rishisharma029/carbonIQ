import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { wasteSchema } from '../schemas/waste.schema'
import { Input } from '@/shared/components/Input'
import Button from '@/shared/components/Button'

type WasteFormValues = z.infer<typeof wasteSchema>

interface WasteFormProps {
  defaultValues: WasteFormValues
  onNext: (data: WasteFormValues) => void
  onBack: () => void
}

export default function WasteForm({ defaultValues, onNext, onBack }: WasteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WasteFormValues>({
    resolver: zodResolver(wasteSchema),
    defaultValues,
  })

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-6 bg-card border border-border p-6 rounded-xl"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Household Waste</h2>
        <p className="text-xs text-muted-foreground">
          Log landfill waste volume and active recycling programs.
        </p>
      </div>

      <div className="space-y-5">
        <Input
          id="landfillBags"
          label="Weekly Landfill Trash Bags Count"
          type="number"
          error={errors.landfillBags?.message}
          description="Average count of standard trash bags sent to landfill per week."
          {...register('landfillBags', { valueAsNumber: true })}
        />

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground select-none block">
            Actively Recycled Materials
          </label>
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-3 text-sm font-medium select-none cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                className="h-4.5 w-4.5 rounded-sm border-border bg-card text-primary focus:ring-primary accent-primary cursor-pointer"
                {...register('recycledPaper')}
              />
              <span>Paper & Cardboard</span>
            </label>

            <label className="flex items-center gap-3 text-sm font-medium select-none cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                className="h-4.5 w-4.5 rounded-sm border-border bg-card text-primary focus:ring-primary accent-primary cursor-pointer"
                {...register('recycledPlastic')}
              />
              <span>Plastics & Metals</span>
            </label>

            <label className="flex items-center gap-3 text-sm font-medium select-none cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                className="h-4.5 w-4.5 rounded-sm border-border bg-card text-primary focus:ring-primary accent-primary cursor-pointer"
                {...register('recycledGlass')}
              />
              <span>Glass bottles & jars</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Save & Review</Button>
      </div>
    </form>
  )
}
