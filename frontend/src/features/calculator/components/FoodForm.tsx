import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { foodSchema } from '../schemas/food.schema'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import Button from '@/shared/components/Button'

type FoodFormValues = z.infer<typeof foodSchema>

interface FoodFormProps {
  defaultValues: FoodFormValues
  onNext: (data: FoodFormValues) => void
  onBack: () => void
}

export default function FoodForm({ defaultValues, onNext, onBack }: FoodFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FoodFormValues>({
    resolver: zodResolver(foodSchema),
    defaultValues,
  })

  return (
    <form
      onSubmit={handleSubmit(onNext)}
      className="space-y-6 bg-card border border-border p-6 rounded-xl"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Diet & Nutrition</h2>
        <p className="text-xs text-muted-foreground">
          Log details about your eating habits and organic consumption share.
        </p>
      </div>

      <div className="space-y-4">
        <Select
          id="dietType"
          label="Diet Type"
          error={errors.dietType?.message}
          {...register('dietType')}
        >
          <option value="meat-heavy">Meat Heavy (Daily beef/pork)</option>
          <option value="balanced">Balanced (Average meat, poultry, fish)</option>
          <option value="vegetarian">Vegetarian (No meat, consumes dairy/eggs)</option>
          <option value="vegan">Vegan (Strict plant-based diet)</option>
        </Select>

        <Input
          id="organicShare"
          label="Locally Sourced / Organic Food Share (%)"
          type="number"
          error={errors.organicShare?.message}
          description="Percentage of food purchased from local, organic, or seasonal supply lines."
          {...register('organicShare', { valueAsNumber: true })}
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
