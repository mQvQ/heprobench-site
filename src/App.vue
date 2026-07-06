<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  BarChart3,
  Database,
  Microscope,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from '@lucide/vue'
import {
  aggregateFoundationModels,
  aggregateMethods,
  clinicalHighlights,
  csvPath,
  formatFoundationMetric,
  formatMetric,
  foundationCsvPath,
  foundationMetricDefinitions,
  foundationMetricValueForAggregate,
  foundationNotes,
  getFoundationMetricDefinition,
  getMetricDefinition,
  metricValueForAggregate,
  methodNotes,
  normalizeForBar,
  paradigmLabels,
  parseCsv,
  summarizeDatasets,
  toBenchmarkRows,
  toFoundationRows,
  type BenchmarkRow,
  type DatasetType,
  type DisplayMetricKey,
  type FoundationCellRow,
  type FoundationFamily,
  type FoundationMetricKey,
  type StainType,
} from './lib/benchmark'

type DatasetTypeFilter = DatasetType | 'all'
type StainTypeFilter = StainType | 'all'
type FoundationFamilyFilter = FoundationFamily | 'all'

const methodRows = ref<BenchmarkRow[]>([])
const foundationRows = ref<FoundationCellRow[]>([])
const isLoading = ref(true)
const loadError = ref('')

const datasetTypeFilter = ref<DatasetTypeFilter>('base')
const stainTypeFilter = ref<StainTypeFilter>('all')
const datasetFilter = ref('all')
const selectedMetric = ref<DisplayMetricKey>('overview')

const foundationFamilyFilter = ref<FoundationFamilyFilter>('all')
const foundationDatasetFilter = ref('all')
const foundationMetric = ref<FoundationMetricKey>('cell_pcc')
const foundationQuery = ref('')

const datasetTypeOptions: Array<{ label: string; value: DatasetTypeFilter }> = [
  { label: 'Base', value: 'base' },
  { label: 'OOD', value: 'generalization' },
  { label: 'All', value: 'all' },
]

const stainTypeOptions: Array<{ label: string; value: StainTypeFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Co-stained', value: 'co-stained' },
  { label: 'Adjacent', value: 'adjacent' },
]

const navItems = [
  { label: 'Overview', href: '#top' },
  { label: 'Virtual methods', href: '#virtual-methods' },
  { label: 'Foundation models', href: '#foundation-models' },
  { label: 'Datasets', href: '#datasets' },
  { label: 'Clinical', href: '#clinical' },
]

const methodMetricGroups = [
  {
    label: 'Overview',
    metrics: ['overview'],
  },
  {
    label: 'Image fidelity',
    metrics: ['patch_rmse', 'patch_ssim', 'patch_psnr'],
  },
  {
    label: 'Visual perception',
    metrics: ['patch_lpips', 'patch_dists'],
  },
  {
    label: 'Cell semantics',
    metrics: ['cell_f1', 'cell_auc', 'cell_balanced_acc', 'cell_pcc'],
  },
] satisfies Array<{ label: string; metrics: DisplayMetricKey[] }>

const methodMetricButtonGroups = methodMetricGroups.map((group) => ({
  ...group,
  metrics: group.metrics.map((key) => getMetricDefinition(key)),
}))

onMounted(async () => {
  try {
    const [methodResponse, foundationResponse] = await Promise.all([
      fetch(csvPath),
      fetch(foundationCsvPath),
    ])

    if (!methodResponse.ok) {
      throw new Error(`Unable to load method benchmark CSV (${methodResponse.status})`)
    }
    if (!foundationResponse.ok) {
      throw new Error(`Unable to load PFM benchmark CSV (${foundationResponse.status})`)
    }

    methodRows.value = toBenchmarkRows(parseCsv(await methodResponse.text()))
    foundationRows.value = toFoundationRows(parseCsv(await foundationResponse.text()))
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load benchmark data'
  } finally {
    isLoading.value = false
  }
})

const filteredRows = computed(() =>
  methodRows.value.filter((row) => {
    const matchesType = datasetTypeFilter.value === 'all' || row.dataset_type === datasetTypeFilter.value
    const matchesStain = stainTypeFilter.value === 'all' || row.stain_type === stainTypeFilter.value
    const matchesDataset = datasetFilter.value === 'all' || row.dataset === datasetFilter.value
    return matchesType && matchesStain && matchesDataset
  }),
)

const datasetOptions = computed(() =>
  [...new Set(methodRows.value
    .filter((row) => datasetTypeFilter.value === 'all' || row.dataset_type === datasetTypeFilter.value)
    .filter((row) => stainTypeFilter.value === 'all' || row.stain_type === stainTypeFilter.value)
    .map((row) => row.dataset))]
    .sort((a, b) => a.localeCompare(b)),
)

const datasetSummaries = computed(() => summarizeDatasets(methodRows.value.filter((row) => row.dataset_type === 'base')))

const methodAggregates = computed(() => {
  const aggregates = aggregateMethods(filteredRows.value)
  const metric = getMetricDefinition(selectedMetric.value)

  return [...aggregates].sort((a, b) => {
    const aValue = metricValueForAggregate(a, selectedMetric.value)
    const bValue = metricValueForAggregate(b, selectedMetric.value)
    return compareMetricValues(aValue, bValue, metric.direction, a.method, b.method)
  })
})

const selectedMetricValues = computed(() =>
  methodAggregates.value.map((aggregate) => metricValueForAggregate(aggregate, selectedMetric.value)),
)

const topMethods = computed(() => methodAggregates.value.slice(0, 4))

const activeMetricDefinition = computed(() => getMetricDefinition(selectedMetric.value))

const filteredFoundationRows = computed(() => {
  const query = foundationQuery.value.trim().toLowerCase()

  return foundationRows.value.filter((row) => {
    const matchesFamily = foundationFamilyFilter.value === 'all' || row.family === foundationFamilyFilter.value
    const matchesDataset = foundationDatasetFilter.value === 'all' || row.dataset === foundationDatasetFilter.value
    const matchesQuery = !query || [row.model_display, row.family, row.pretraining, row.dataset_display]
      .join(' ')
      .toLowerCase()
      .includes(query)

    return matchesFamily && matchesDataset && matchesQuery
  })
})

const foundationAggregates = computed(() => {
  const aggregates = aggregateFoundationModels(filteredFoundationRows.value)
  const metric = getFoundationMetricDefinition(foundationMetric.value)

  return [...aggregates].sort((a, b) => {
    const aValue = foundationMetricValueForAggregate(a, foundationMetric.value)
    const bValue = foundationMetricValueForAggregate(b, foundationMetric.value)
    return compareMetricValues(aValue, bValue, metric.direction, a.model, b.model)
  })
})

const foundationMetricValues = computed(() =>
  foundationAggregates.value.map((aggregate) => foundationMetricValueForAggregate(aggregate, foundationMetric.value)),
)

const activeFoundationMetric = computed(() => getFoundationMetricDefinition(foundationMetric.value))

const foundationDatasetOptions = computed(() =>
  [...new Map(foundationRows.value.map((row) => [row.dataset, row.dataset_display])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1])),
)

const foundationFamilyOptions = computed(() =>
  [...new Set(foundationRows.value.map((row) => row.family))]
    .sort((a, b) => a.localeCompare(b)),
)

const baseRows = computed(() => methodRows.value.filter((row) => row.dataset_type === 'base'))
const totalDatasets = computed(() => new Set(baseRows.value.map((row) => row.dataset)).size)
const totalEvaluationScenarios = computed(() => new Set(methodRows.value.map((row) => row.dataset)).size)
const totalMethods = computed(() => new Set(methodRows.value.map((row) => row.method_display)).size)
const totalFoundationModels = computed(() => new Set(foundationRows.value.map((row) => row.model_id)).size)
const overviewStats = computed(() => [
  { label: 'Datasets', value: totalDatasets.value },
  { label: 'Evaluation scenarios', value: totalEvaluationScenarios.value },
  { label: 'Protein markers', value: '106' },
  { label: 'Cancer types', value: '33' },
  { label: 'Virtual methods', value: totalMethods.value },
  { label: 'PFM encoders', value: totalFoundationModels.value },
  { label: 'Patches', value: '611K' },
  { label: 'Annotated cells', value: '87.3M' },
])

function compareMetricValues(
  aValue: number | null,
  bValue: number | null,
  direction: 'higher' | 'lower',
  aFallback: string,
  bFallback: string,
): number {
  if (aValue === null && bValue === null) {
    return aFallback.localeCompare(bFallback)
  }
  if (aValue === null) {
    return 1
  }
  if (bValue === null) {
    return -1
  }

  return direction === 'higher' ? bValue - aValue : aValue - bValue
}

function resetMethodFilters() {
  datasetTypeFilter.value = 'base'
  stainTypeFilter.value = 'all'
  datasetFilter.value = 'all'
  selectedMetric.value = 'overview'
}

function resetFoundationFilters() {
  foundationFamilyFilter.value = 'all'
  foundationDatasetFilter.value = 'all'
  foundationMetric.value = 'cell_pcc'
  foundationQuery.value = ''
}

function setDatasetType(value: DatasetTypeFilter) {
  datasetTypeFilter.value = value
  datasetFilter.value = 'all'
}

function setStainType(value: StainTypeFilter) {
  stainTypeFilter.value = value
  datasetFilter.value = 'all'
}

function paradigmLabel(paradigm: string): string {
  return paradigmLabels[paradigm] ?? paradigm.replace(/_/g, ' ')
}

function paradigmClass(paradigm: string): string {
  const classes: Record<string, string> = {
    dense_prediction: 'border-moss/30 bg-moss/10 text-moss',
    paired_generation: 'border-cobalt/30 bg-cobalt/10 text-cobalt',
    unpaired_generation: 'border-coral/30 bg-coral/10 text-coral',
    context_aggregated_regression: 'border-amber/30 bg-amber/10 text-amber',
  }

  return classes[paradigm] ?? 'border-ink/10 bg-ink/5 text-ink'
}

function familyClass(family: FoundationFamily): string {
  const classes: Record<FoundationFamily, string> = {
    'Vision-only': 'border-moss/30 bg-moss/10 text-moss',
    'Vision-language': 'border-cobalt/30 bg-cobalt/10 text-cobalt',
    'Vision-omics': 'border-coral/30 bg-coral/10 text-coral',
    Unknown: 'border-ink/10 bg-ink/5 text-ink/70',
  }

  return classes[family]
}

function metricBarWidth(value: number | null): string {
  const normalized = normalizeForBar(value, selectedMetricValues.value, activeMetricDefinition.value.direction)
  return `${Math.max(6, Math.round(normalized * 100))}%`
}

function foundationBarWidth(value: number | null): string {
  const normalized = normalizeForBar(value, foundationMetricValues.value, activeFoundationMetric.value.direction)
  return `${Math.max(6, Math.round(normalized * 100))}%`
}

</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <header class="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur lg:hidden">
      <div class="flex items-center justify-between px-4 py-3">
        <a href="#top" class="flex items-center gap-2 font-bold">
          <span class="flex h-8 w-8 items-center justify-center rounded-md bg-cobalt text-paper">
            <Microscope class="h-4 w-4" />
          </span>
          HEPROBench
        </a>
      </div>
      <nav class="flex gap-1 overflow-x-auto px-3 pb-3 text-xs font-semibold text-ink/65">
        <a
          v-for="item in navItems"
          :key="item.href"
          :href="item.href"
          class="shrink-0 rounded-md px-2.5 py-1.5 hover:bg-surface hover:text-ink"
        >
          {{ item.label }}
        </a>
      </nav>
    </header>

    <aside class="fixed inset-y-0 left-0 z-30 hidden w-44 border-r border-ink/10 bg-surface lg:block">
      <div class="flex h-full flex-col px-4 py-5">
        <a href="#top" class="flex items-center gap-2">
          <span class="flex h-9 w-9 items-center justify-center rounded-md bg-cobalt text-paper">
            <Microscope class="h-4 w-4" />
          </span>
          <span>
            <span class="block text-base font-bold leading-5">HEPROBench</span>
            <span class="block text-[11px] text-ink/50">benchmark</span>
          </span>
        </a>

        <nav class="mt-8 grid gap-1 text-[13px] font-semibold text-ink/65">
          <a
            v-for="item in navItems"
            :key="item.href"
            :href="item.href"
            class="rounded-md px-2 py-2 hover:bg-paper hover:text-ink"
          >
            {{ item.label }}
          </a>
        </nav>
      </div>
    </aside>

    <main id="top" class="lg:pl-44">
      <section class="section-shell pt-8 lg:pt-12">
        <div class="overview-shell p-5 sm:p-7 lg:p-8">
          <div>
            <p class="eyebrow">Virtual spatial proteomics benchmark</p>
            <h1 class="mt-3 max-w-4xl text-5xl font-semibold leading-none text-ink sm:text-7xl">
              HEPROBench
            </h1>
            <p class="mt-5 max-w-4xl text-base leading-7 text-ink/70">
              H&E-to-protein prediction benchmark with separate leaderboards for virtual staining methods and
              pathology foundation models, evaluated across image fidelity, visual perception, cell semantics,
              and downstream clinical utility.
            </p>
          </div>

          <div class="mt-7 grid gap-3 lg:grid-cols-2">
            <a href="#virtual-methods" class="leaderboard-tile transition hover:border-cobalt/70">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="eyebrow">Leaderboard 1</div>
                  <div class="mt-2 text-2xl font-semibold">Virtual stain methods</div>
                </div>
                <BarChart3 class="h-5 w-5 text-cobalt" />
              </div>
              <p class="mt-4 text-sm leading-6 text-ink/65">
                {{ totalMethods }} methods across {{ totalEvaluationScenarios }} evaluation scenarios, grouped by
                image fidelity, visual perception, and cell semantics.
              </p>
            </a>

            <a href="#foundation-models" class="leaderboard-tile transition hover:border-moss/70">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="eyebrow">Leaderboard 2</div>
                  <div class="mt-2 text-2xl font-semibold">Pathology foundation models</div>
                </div>
                <Database class="h-5 w-5 text-moss" />
              </div>
              <p class="mt-4 text-sm leading-6 text-ink/65">
                {{ totalFoundationModels }} frozen encoders across {{ totalDatasets }} datasets, ranked by Cell PCC,
                Cell AUROC, and Cell F1.
              </p>
            </a>
          </div>

          <div class="mt-6 grid gap-px overflow-hidden rounded-lg border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="stat in overviewStats" :key="stat.label" class="bg-paper/70 p-4">
              <div class="text-[11px] font-semibold text-ink/50">{{ stat.label }}</div>
              <div class="mt-1 font-mono text-3xl font-semibold">{{ stat.value }}</div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="isLoading" class="section-shell">
        <div class="panel px-4 py-8 text-sm text-ink/60">Loading benchmark data...</div>
      </section>

      <section v-else-if="loadError" class="section-shell">
        <div class="panel border-coral/30 bg-coral/5 px-4 py-8 text-sm text-coral">{{ loadError }}</div>
      </section>

      <template v-else>
        <section id="virtual-methods" class="section-shell">
          <div class="section-heading">
            <div>
              <p class="eyebrow flex items-center gap-2">
                <BarChart3 class="h-3.5 w-3.5" />
                Leaderboard 1
              </p>
              <h2 class="mt-2 text-3xl font-semibold">Virtual stain methods</h2>
              <p class="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                Eight baseline methods are ranked by the active metric across the selected dataset scope.
                The overview score min-max normalizes all nine metrics with direction-aware handling.
              </p>
            </div>
            <button class="icon-button h-9 w-fit" type="button" @click="resetMethodFilters">
              <RotateCcw class="h-3.5 w-3.5" />
              Reset
            </button>
          </div>

          <div class="mt-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside class="panel p-4">
              <div class="flex items-center gap-2 text-sm font-bold">
                <SlidersHorizontal class="h-4 w-4" />
                Filters
              </div>

              <div class="mt-4 grid gap-4">
                <div>
                  <label class="filter-label">Evaluation set</label>
                  <div class="mt-2 grid gap-1">
                    <button
                      v-for="option in datasetTypeOptions"
                      :key="option.value"
                      type="button"
                      class="segmented-button"
                      :class="datasetTypeFilter === option.value ? 'segmented-active' : 'segmented-idle'"
                      @click="setDatasetType(option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <div>
                  <label class="filter-label">Tissue setting</label>
                  <div class="mt-2 grid gap-1">
                    <button
                      v-for="option in stainTypeOptions"
                      :key="option.value"
                      type="button"
                      class="segmented-button"
                      :class="stainTypeFilter === option.value ? 'segmented-active' : 'segmented-idle'"
                      @click="setStainType(option.value)"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>

                <label class="block">
                  <span class="filter-label">Dataset</span>
                  <select v-model="datasetFilter" class="control mt-2 w-full">
                    <option value="all">All datasets</option>
                    <option v-for="dataset in datasetOptions" :key="dataset" :value="dataset">
                      {{ dataset }}
                    </option>
                  </select>
                </label>
              </div>
            </aside>

            <div class="grid gap-4">
              <div class="panel p-3">
                <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div v-for="group in methodMetricButtonGroups" :key="group.label" class="metric-group">
                    <div class="metric-group-label">{{ group.label }}</div>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                      <button
                        v-for="metric in group.metrics"
                        :key="metric.key"
                        type="button"
                        class="metric-button"
                        :class="selectedMetric === metric.key ? 'metric-active' : 'metric-idle'"
                        @click="selectedMetric = metric.key"
                      >
                        {{ metric.shortLabel }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div class="panel overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="compact-table min-w-[1180px]">
                      <thead>
                        <tr>
                          <th rowspan="2">Method</th>
                          <th rowspan="2">Paradigm</th>
                          <th rowspan="2" class="text-right">Overview</th>
                          <th colspan="3" class="metric-superhead">Image fidelity</th>
                          <th colspan="2" class="metric-superhead">Visual perception</th>
                          <th colspan="4" class="metric-superhead">Cell semantics</th>
                        </tr>
                        <tr>
                          <th class="text-right">RMSE</th>
                          <th class="text-right">SSIM</th>
                          <th class="text-right">PSNR</th>
                          <th class="text-right">LPIPS</th>
                          <th class="text-right">DISTS</th>
                          <th class="text-right">Cell-F1</th>
                          <th class="text-right">Cell AUROC</th>
                          <th class="text-right">Bal-Acc</th>
                          <th class="text-right">PCC</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="aggregate in methodAggregates" :key="aggregate.method">
                          <td>
                            <div class="font-bold">{{ aggregate.method }}</div>
                            <div class="mt-0.5 text-[11px] text-ink/50">
                              {{ aggregate.rows }} {{ aggregate.rows === 1 ? 'evaluation' : 'evaluations' }}
                            </div>
                          </td>
                          <td>
                            <span class="badge paradigm-badge" :class="paradigmClass(aggregate.paradigm)">
                              {{ paradigmLabel(aggregate.paradigm) }}
                            </span>
                          </td>
                          <td class="text-right font-bold">{{ formatMetric('overview', aggregate.score) }}</td>
                          <td class="text-right">{{ formatMetric('patch_rmse', aggregate.metrics.patch_rmse) }}</td>
                          <td class="text-right">{{ formatMetric('patch_ssim', aggregate.metrics.patch_ssim) }}</td>
                          <td class="text-right">{{ formatMetric('patch_psnr', aggregate.metrics.patch_psnr) }}</td>
                          <td class="text-right">{{ formatMetric('patch_lpips', aggregate.metrics.patch_lpips) }}</td>
                          <td class="text-right">{{ formatMetric('patch_dists', aggregate.metrics.patch_dists) }}</td>
                          <td class="text-right">{{ formatMetric('cell_f1', aggregate.metrics.cell_f1) }}</td>
                          <td class="text-right">{{ formatMetric('cell_auc', aggregate.metrics.cell_auc) }}</td>
                          <td class="text-right">{{ formatMetric('cell_balanced_acc', aggregate.metrics.cell_balanced_acc) }}</td>
                          <td class="text-right">{{ formatMetric('cell_pcc', aggregate.metrics.cell_pcc) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <aside class="panel p-4">
                  <div class="text-sm font-bold">{{ activeMetricDefinition.label }}</div>
                  <div class="mt-1 text-xs text-ink/55">
                    {{ activeMetricDefinition.direction === 'higher' ? 'Higher is better' : 'Lower is better' }}
                  </div>

                  <div class="mt-4 space-y-3">
                    <div v-for="aggregate in topMethods" :key="aggregate.method">
                      <div class="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span class="font-bold">{{ aggregate.method }}</span>
                        <span class="font-bold text-cobalt">
                          {{ formatMetric(selectedMetric, metricValueForAggregate(aggregate, selectedMetric)) }}
                        </span>
                      </div>
                      <div class="h-2 overflow-hidden rounded bg-ink/10">
                        <div
                          class="h-full rounded bg-cobalt"
                          :style="{ width: metricBarWidth(metricValueForAggregate(aggregate, selectedMetric)) }"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 grid gap-2 border-t border-ink/10 pt-4">
                    <div v-for="note in methodNotes" :key="note.title">
                      <div class="text-xs font-bold">{{ note.title }}</div>
                      <p class="mt-1 text-xs leading-5 text-ink/60">{{ note.body }}</p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section id="foundation-models" class="section-shell border-t border-ink/10">
          <div class="section-heading">
            <div>
              <p class="eyebrow flex items-center gap-2">
                <Database class="h-3.5 w-3.5" />
                Leaderboard 2
              </p>
              <h2 class="mt-2 text-3xl font-semibold">Pathology foundation models</h2>
              <p class="mt-3 max-w-3xl text-sm leading-6 text-ink/65">
                Frozen-DPT encoder runs are ranked with cell-level evaluation outputs. The primary metric is
                Cell PCC, with Cell AUROC and Cell F1 available as alternate views.
              </p>
            </div>
            <button class="icon-button h-9 w-fit" type="button" @click="resetFoundationFilters">
              <RotateCcw class="h-3.5 w-3.5" />
              Reset
            </button>
          </div>

          <div class="mt-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside class="panel p-4">
              <div class="flex items-center gap-2 text-sm font-bold">
                <SlidersHorizontal class="h-4 w-4" />
                Filters
              </div>

              <div class="mt-4 grid gap-4">
                <label class="block">
                  <span class="filter-label">Model family</span>
                  <select v-model="foundationFamilyFilter" class="control mt-2 w-full">
                    <option value="all">All families</option>
                    <option v-for="family in foundationFamilyOptions" :key="family" :value="family">
                      {{ family }}
                    </option>
                  </select>
                </label>

                <label class="block">
                  <span class="filter-label">Dataset</span>
                  <select v-model="foundationDatasetFilter" class="control mt-2 w-full">
                    <option value="all">All datasets</option>
                    <option v-for="[dataset, label] in foundationDatasetOptions" :key="dataset" :value="dataset">
                      {{ label }}
                    </option>
                  </select>
                </label>

                <label class="block">
                  <span class="filter-label">Search</span>
                  <span class="relative mt-2 block">
                    <Search class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
                    <input v-model="foundationQuery" class="control w-full pl-9" type="search" placeholder="Model or dataset" />
                  </span>
                </label>
              </div>
            </aside>

            <div class="grid gap-4">
              <div class="panel p-3">
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="metric in foundationMetricDefinitions"
                    :key="metric.key"
                    type="button"
                    class="metric-button"
                    :class="foundationMetric === metric.key ? 'metric-active' : 'metric-idle'"
                    @click="foundationMetric = metric.key"
                  >
                    {{ metric.shortLabel }}
                  </button>
                </div>
              </div>

              <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div class="panel overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="compact-table min-w-[620px]">
                      <thead>
                        <tr>
                          <th>Model</th>
                          <th>Family</th>
                          <th class="text-right">{{ activeFoundationMetric.shortLabel }}</th>
                          <th class="text-right">Cell PCC</th>
                          <th class="text-right">AUROC</th>
                          <th class="text-right">F1</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="aggregate in foundationAggregates" :key="aggregate.modelId">
                          <td>
                            <div class="font-bold">{{ aggregate.model }}</div>
                            <div class="mt-0.5 text-[11px] text-ink/50">{{ aggregate.rows }} runs</div>
                          </td>
                          <td>
                            <span class="badge" :class="familyClass(aggregate.family)">
                              {{ aggregate.family }}
                            </span>
                          </td>
                          <td class="text-right font-bold">
                            {{ formatFoundationMetric(foundationMetric, foundationMetricValueForAggregate(aggregate, foundationMetric)) }}
                          </td>
                          <td class="text-right">{{ formatFoundationMetric('cell_pcc', aggregate.meanPcc) }}</td>
                          <td class="text-right">{{ formatFoundationMetric('cell_auc', aggregate.meanAuc) }}</td>
                          <td class="text-right">{{ formatFoundationMetric('cell_f1', aggregate.meanF1) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <aside class="panel p-4">
                  <div class="text-sm font-bold">{{ activeFoundationMetric.label }}</div>
                  <div class="mt-1 text-xs text-ink/55">
                    {{ activeFoundationMetric.direction === 'higher' ? 'Higher is better' : 'Lower is better' }}
                  </div>

                  <div class="mt-4 space-y-3">
                    <div v-for="aggregate in foundationAggregates.slice(0, 4)" :key="aggregate.modelId">
                      <div class="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span class="font-bold">{{ aggregate.model }}</span>
                        <span class="font-bold text-moss">
                          {{ formatFoundationMetric(foundationMetric, foundationMetricValueForAggregate(aggregate, foundationMetric)) }}
                        </span>
                      </div>
                      <div class="h-2 overflow-hidden rounded bg-ink/10">
                        <div
                          class="h-full rounded bg-moss"
                          :style="{ width: foundationBarWidth(foundationMetricValueForAggregate(aggregate, foundationMetric)) }"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-5 grid gap-2 border-t border-ink/10 pt-4">
                    <div v-for="note in foundationNotes" :key="note.title">
                      <div class="text-xs font-bold">{{ note.title }}</div>
                      <p class="mt-1 text-xs leading-5 text-ink/60">{{ note.body }}</p>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section id="datasets" class="section-shell border-t border-ink/10">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Benchmark coverage</p>
              <h2 class="mt-2 text-3xl font-semibold">Datasets and assay settings</h2>
            </div>
            <p class="max-w-2xl text-sm leading-6 text-ink/65">
              Base cohorts include CODEX, IMC, and mIHC data with co-stained and adjacent-section acquisition.
            </p>
          </div>

          <div class="mt-6 grid gap-px overflow-hidden rounded-md border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
            <article v-for="dataset in datasetSummaries" :key="dataset.name" class="bg-surface p-4">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="font-bold">{{ dataset.name }}</h3>
                  <p class="mt-1 text-xs text-ink/55">{{ dataset.methods }} methods, {{ dataset.rows }} rows</p>
                </div>
                <span
                  class="badge"
                  :class="dataset.stain === 'co-stained' ? 'border-moss/30 bg-moss/10 text-moss' : 'border-coral/30 bg-coral/10 text-coral'"
                >
                  {{ dataset.stain }}
                </span>
              </div>
            </article>
          </div>
        </section>

        <section id="clinical" class="section-shell border-t border-ink/10">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Clinical validation</p>
              <h2 class="mt-2 text-3xl font-semibold">Virtual markers as complementary signals</h2>
            </div>
            <p class="max-w-2xl text-sm leading-6 text-ink/65">
              Downstream analyses compare H&E-only, virtual-marker-only, and fused H+V representations.
            </p>
          </div>

          <div class="mt-6 grid gap-px overflow-hidden rounded-md border border-ink/10 bg-ink/10 md:grid-cols-3">
            <article v-for="highlight in clinicalHighlights" :key="highlight.label" class="bg-surface p-5">
              <div class="text-[11px] font-bold uppercase text-cobalt">{{ highlight.label }}</div>
              <div class="mt-3 font-mono text-4xl font-semibold">{{ highlight.value }}</div>
              <h3 class="mt-4 text-base font-bold leading-6">{{ highlight.title }}</h3>
              <p class="mt-3 text-sm leading-6 text-ink/65">{{ highlight.caption }}</p>
            </article>
          </div>
        </section>

      </template>
    </main>

    <footer class="border-t border-ink/10 bg-surface lg:pl-44">
      <div class="section-shell py-6 text-xs leading-5 text-ink/55">
        <p>
          Source paper: <span class="text-ink/70">Benchmarking virtual spatial proteomics prediction from
          histopathology images for clinical utility</span>.
        </p>
        <p class="mt-1">Benchmark tables are derived from the paper's method summaries and foundation-model cell metrics.</p>
      </div>
    </footer>
  </div>
</template>
