import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { electricitySchema } from '../schemas/electricity.schema'
import { Input } from '@/shared/components/Input'
import Button from '@/shared/components/Button'

type ElectricityFormValues = z.infer<typeof electricitySchema>

interface ElectricityFormProps {
  defaultValues: ElectricityFormValues
  onNext: (data: ElectricityFormValues) => void
  onBack: () => void
}

export default function ElectricityForm({ defaultValues, onNext, onBack }: ElectricityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ElectricityFormValues>({
    resolver: zodResolver(electricitySchema),
    defaultValues,
  })

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-6 bg-card border border-border p-6 rounded-xl"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Electricity & Utilities</h2>
        <p className="text-xs text-muted-foreground">
          Log details about your household grid power consumption.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          id="gridConsumption"
          label="Monthly Electricity Consumption (kWh)"
          type="number"
          error={errors.gridConsumption?.message}
          {...register('gridConsumption', { valueAsNumber: true })}
        />

        <Input
          id="cleanEnergyShare"
          label="Renewable / Clean Energy Share (%)"
          type="number"
          error={errors.cleanEnergyShare?.message}
          description="Percentage of electricity supplied by solar, wind, or green energy tariffs."
          {...register('cleanEnergyShare', { valueAsNumber: true })}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Save & Continue</Button>
      </div>
    </form>
  )
}
