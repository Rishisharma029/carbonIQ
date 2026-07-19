# CarbonIQ Calculation Engine & Carbon Emission Processing Architecture (v2)

## Purpose

Design a deterministic, modular, versioned calculation engine capable of producing accurate, explainable, and reproducible carbon emission estimates.

---

## Core Principles

- **Deterministic Outputs**: The same input and emission factors always yield the exact same emission calculation.
- **Pure Calculation Functions**: Calculations contain zero side effects, no database calls, and no random variables.
- **Explainable Results**: Every calculation returns the specific formula, input, and factor used to justify the output.
- **Dependency Injection**: All external parameters (emission factors) are resolved asynchronously first, then injected into the synchronous calculation modules.
- **Infrastructure Independent**: The core domain calculation logic can be executed in any environment (Node, browser, workers, CLI) without modifications.

---

## High-Level Pipeline

```
[User Input DTO]
       │
       ▼
[Validation (Zod)]
       │
       ▼
[Normalization] (Converts inputs to standard metric units)
       │
       ▼
[Async Factor Resolver] (Concurs lookups via Promise.all)
       │
       ▼
[Factor Injection]
       │
       ▼
[Calculator Registry] (Dispatches to Category Calculators)
       │
       ▼
[Synchronous Calculators] (Transport, Electricity, Food, Waste, Water, Gas)
       │
       ▼
[Aggregator & Score Engine] (Sums outputs, computes 0-100 sustainability index)
       │
       ▼
[Explainability Generator] (Compiles steps, formulas, and confidence levels)
       │
       ▼
[Result DTO]
```

---

## Supported Categories (v1)

Each calculator follows a strict interface: `calculate(normalizedData, resolvedFactors) -> Result DTO`
- **Transport**: Supports distance-based commuting with fuel efficiency factors (vehicle type: car, bus, train, motorcycle).
- **Electricity**: Grid-based consumption (kWh) mapped to regional grid intensity factors.
- **Food**: Dietary profile carbon offsets (meat, vegetarian, vegan, dairy scale).
- **Waste**: Solid waste output (kg) based on trash volume and recycling efficiency rates.
- **Water**: Fresh water usage (liters) multiplied by filtration and treatment intensities.
- **LPG / Natural Gas**: Home heating fuel volume ($m^3$) mapped to chemical combustion indexes.

---

## Confidence Level Scoring

To maintain transparent data quality, every calculation yields a confidence score:
- **HIGH (90-100%)**: Raw usage data + regional/specific emission factors used.
- **MEDIUM (60-89%)**: Generic proxy inputs or national average emission factors used.
- **LOW (below 60%)**: Default fallbacks or rough user-estimated volume inputs used.

### Rules Matrix
- If `inputMethod === 'exact'` and `factorRegion === userRegion` $\rightarrow$ **HIGH**.
- If `inputMethod === 'estimated'` or `factorRegion === 'national_average'` $\rightarrow$ **MEDIUM**.
- If `factorRegion === 'global_fallback'` or inputs contain null defaults $\rightarrow$ **LOW**.

---

## Result DTO & Explainability Format

Every calculation payload returns an audit payload for debugging and end-user explainability:
```json
{
  "totalEmission": 12.45,
  "categories": {
    "transport": {
      "emission": 4.15,
      "formula": "distanceKm * vehicleFactor",
      "inputs": { "distanceKm": 1200 },
      "factors": { "vehicleFactor": 0.00346, "source": "US EPA 2026" },
      "confidence": {
        "level": "HIGH",
        "reason": "Used exact odometer reading and regional EPA vehicle subcategory factors."
      }
    }
  }
}
```

---

## Caching & Caching Key Rules

To preserve calculation performance:
- Synchronous calculations are **not** cached since execution is sub-millisecond.
- Asynchronous emission factor lookups from the repository are cached in Redis (with fallback to MongoDB memory caches) using structured, versioned cache keys:
  - `factor:[key]:[region]:[version]` (e.g. `factor:grid_electricity:us-east:v2`)

---

## Engineering Standards

- Maintain zero side-effects inside domain calculators.
- Enforce strict unit normalization (e.g., standardizing miles to kilometers, therms to kWh) prior to calculation loops.
- Snapshot the exact formula versions and factor values at the time of writing to prevent retroactively modifying historical user footprints when factors update.
- Ensure all category engines are unit-tested with mathematical golden datasets.
