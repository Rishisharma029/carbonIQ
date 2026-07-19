import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { transportSchema } from '../schemas/transport.schema'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import Button from '@/shared/components/Button'

type TransportFormValues = z.infer<typeof transportSchema>

interface TransportFormProps {
  defaultValues: TransportFormValues
  onNext: (data: TransportFormValues) => void
}

export default function TransportForm({ defaultValues, onNext }: TransportFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransportFormValues>({
    resolver: zodResolver(transportSchema),
    defaultValues,
  })

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-6 bg-card border border-border p-6 rounded-xl"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Transportation</h2>
        <p className="text-xs text-muted-foreground">
          Log details about your personal vehicle travel, public transit, and flights.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          id="carDistance"
          label="Weekly Car Driving Distance (miles)"
          type="number"
          error={errors.carDistance?.message}
          {...register('carDistance', { valueAsNumber: true })}
        />

        <Select
          id="carFuelType"
          label="Car Fuel Type"
          error={errors.carFuelType?.message}
          {...register('carFuelType')}
        >
          <option value="none">No car / Don't drive</option>
          <option value="gasoline">Gasoline</option>
          <option value="diesel">Diesel</option>
          <option value="hybrid">Hybrid</option>
          <option value="electric">Electric (EV)</option>
        </Select>

        <Input
          id="transitHours"
          label="Weekly Public Transit Usage (hours)"
          type="number"
          error={errors.transitHours?.message}
          {...register('transitHours', { valueAsNumber: true })}
        />

        <Input
          id="flightHours"
          label="Annual Air Travel Duration (hours)"
          type="number"
          error={errors.flightHours?.message}
          {...register('flightHours', { valueAsNumber: true })}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">Save & Continue</Button>
      </div>
    </form>
  )
}
