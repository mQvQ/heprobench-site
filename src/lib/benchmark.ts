export type DatasetType = 'base' | 'generalization'
export type StainType = 'co-stained' | 'adjacent'
export type MetricKey =
  | 'cell_pcc'
  | 'cell_auc'
  | 'cell_f1'
  | 'cell_balanced_acc'
  | 'cell_auprc'
  | 'pixel_pcc'
  | 'patch_ssim'
  | 'patch_psnr'
  | 'patch_rmse'
  | 'patch_lpips'
  | 'patch_dists'

export type DisplayMetricKey = MetricKey | 'overview'
export type FoundationFamily = 'Vision-only' | 'Vision-language' | 'Vision-omics' | 'Unknown'
export type FoundationMetricKey = 'cell_pcc' | 'cell_auc' | 'cell_f1'

export interface BenchmarkRow {
  dataset: string
  dataset_type: DatasetType
  train_dataset: string
  test_dataset: string
  stain_type: StainType
  method_display: string
  paradigm: string
  cell_pcc: number | null
  cell_f1: number | null
  cell_auc: number | null
  cell_auprc: number | null
  cell_balanced_acc: number | null
  pixel_pcc: number | null
  patch_ssim: number | null
  patch_psnr: number | null
  patch_rmse: number | null
  patch_lpips: number | null
  patch_dists: number | null
}

export interface FoundationCellRow {
  dataset: string
  dataset_display: string
  stain_type: StainType
  model_id: string
  model_display: string
  family: FoundationFamily
  pretraining: string
  run_dir: string
  cell_pcc: number | null
  cell_pcc_markers_used: number | null
  cell_auc: number | null
  cell_f1: number | null
  cell_f1_markers_used: number | null
}

export interface MetricDefinition {
  key: DisplayMetricKey
  label: string
  shortLabel: string
  direction: 'higher' | 'lower'
  group: 'Overview' | 'Cell semantics' | 'Image fidelity' | 'Visual perception'
}

export interface FoundationMetricDefinition {
  key: FoundationMetricKey
  label: string
  shortLabel: string
  direction: 'higher' | 'lower'
}

export interface MethodAggregate {
  method: string
  paradigm: string
  rows: number
  score: number
  metrics: Record<MetricKey, number | null>
}

export interface FoundationModelAggregate {
  modelId: string
  model: string
  family: FoundationFamily
  pretraining: string
  rows: number
  meanPcc: number | null
  meanAuc: number | null
  meanF1: number | null
  coStainedPcc: number | null
  adjacentPcc: number | null
  runs: FoundationCellRow[]
}

export interface DatasetSummary {
  name: string
  stain: StainType
  rows: number
  methods: number
}

export const benchmarkVersion = '1.0.0'
export const csvPath = '/data/heprobench_v1.0.0_methods.csv'
export const foundationCsvPath = '/data/heprobench_v1.0.0_foundation_models.csv'

export const metricDefinitions: MetricDefinition[] = [
  { key: 'overview', label: 'Overview score', shortLabel: 'Score', direction: 'higher', group: 'Overview' },
  { key: 'cell_pcc', label: 'Cell PCC', shortLabel: 'PCC', direction: 'higher', group: 'Cell semantics' },
  { key: 'cell_auc', label: 'Cell AUROC', shortLabel: 'AUROC', direction: 'higher', group: 'Cell semantics' },
  { key: 'cell_f1', label: 'Cell F1', shortLabel: 'F1', direction: 'higher', group: 'Cell semantics' },
  { key: 'cell_auprc', label: 'Cell AUPRC', shortLabel: 'AUPRC', direction: 'higher', group: 'Cell semantics' },
  {
    key: 'cell_balanced_acc',
    label: 'Balanced accuracy',
    shortLabel: 'Bal-Acc',
    direction: 'higher',
    group: 'Cell semantics',
  },
  { key: 'pixel_pcc', label: 'Pixel PCC', shortLabel: 'Pixel PCC', direction: 'higher', group: 'Image fidelity' },
  { key: 'patch_ssim', label: 'Patch SSIM', shortLabel: 'SSIM', direction: 'higher', group: 'Image fidelity' },
  { key: 'patch_psnr', label: 'Patch PSNR', shortLabel: 'PSNR', direction: 'higher', group: 'Image fidelity' },
  { key: 'patch_rmse', label: 'Patch RMSE', shortLabel: 'RMSE', direction: 'lower', group: 'Image fidelity' },
  { key: 'patch_lpips', label: 'Patch LPIPS', shortLabel: 'LPIPS', direction: 'lower', group: 'Visual perception' },
  { key: 'patch_dists', label: 'Patch DISTS', shortLabel: 'DISTS', direction: 'lower', group: 'Visual perception' },
]

export const foundationMetricDefinitions: FoundationMetricDefinition[] = [
  { key: 'cell_pcc', label: 'Mean Cell PCC', shortLabel: 'PCC', direction: 'higher' },
  { key: 'cell_auc', label: 'Mean Cell AUROC', shortLabel: 'AUROC', direction: 'higher' },
  { key: 'cell_f1', label: 'Mean Cell F1', shortLabel: 'F1', direction: 'higher' },
]

export const metricKeys = metricDefinitions
  .filter((metric): metric is MetricDefinition & { key: MetricKey } => metric.key !== 'overview')
  .map((metric) => metric.key)

export const benchmarkStats = [
  { value: '9', label: 'datasets' },
  { value: '8', label: 'patient cohorts' },
  { value: '33', label: 'cancer types' },
  { value: '106', label: 'protein markers' },
  { value: '785', label: 'paired slides' },
  { value: '611,205', label: 'patches' },
  { value: '85.6M', label: 'annotated cells' },
  { value: '8 + 15', label: 'methods + PFMs' },
]

export const methodNotes = [
  {
    title: 'Dense regression leads the method benchmark',
    body: 'Miphei-ViT ranks first overall, followed by GigaTIME-Reg; dense regression with paired supervision performed best.',
  },
  {
    title: 'Overview score',
    body: 'Each metric is averaged over datasets and min-max normalized across methods; image-level and cell-level metrics contribute equally.',
  },
  {
    title: 'Generalization remains difficult',
    body: 'After transfer from CRC-CODEX to other cohorts, cell-level performance decreases for all methods.',
  },
]

export const foundationNotes = [
  {
    title: 'Metric scope',
    body: 'PFMs are compared only with cell-level metrics: Cell PCC, Cell AUROC, and Cell F1.',
  },
  {
    title: 'Dataset coverage',
    body: 'The cell-metric table contains 135 runs across 15 encoders and 9 datasets.',
  },
]

export const clinicalHighlights = [
  {
    label: 'Survival',
    title: 'Virtual markers carry prognostic information',
    value: '0.67',
    caption: 'C-index of Miphei-ViT virtual markers alone in TCGA-UCEC, close to 0.68 for UNI2 H&E features.',
  },
  {
    label: 'External validation',
    title: 'Virtual PD-L1 replicated in external cohorts',
    value: 'HR 0.87',
    caption: 'Per standard deviation in two external gastric cancer cohorts (1,047 patients; Holm-adjusted p = 0.004).',
  },
  {
    label: 'Beyond H&E',
    title: 'Virtual markers and H&E carry largely the same information',
    value: '0/32',
    caption: 'Comparisons in TCGA in which adding virtual markers to H&E features improved survival prediction of the deep model.',
  },
]

export const paradigmLabels: Record<string, string> = {
  paired_generation: 'Paired generation',
  unpaired_generation: 'Unpaired generation',
  context_aggregated_regression: 'Context-aggregated regression',
  dense_prediction: 'Dense regression',
}

const benchmarkNumericColumns = new Set<string>([
  'cell_pcc',
  'cell_f1',
  'cell_auc',
  'cell_auprc',
  'cell_balanced_acc',
  'pixel_pcc',
  'patch_ssim',
  'patch_psnr',
  'patch_rmse',
  'patch_lpips',
  'patch_dists',
])

const foundationNumericColumns = new Set<string>([
  'cell_pcc',
  'cell_pcc_markers_used',
  'cell_auc',
  'cell_f1',
  'cell_f1_markers_used',
])

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      field += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1
      }
      row.push(field)
      if (row.some((value) => value.length > 0)) {
        rows.push(row)
      }
      row = []
      field = ''
      continue
    }

    field += char
  }

  row.push(field)
  if (row.some((value) => value.length > 0)) {
    rows.push(row)
  }

  const [header, ...body] = rows
  if (!header) {
    return []
  }

  return body.map((values) =>
    Object.fromEntries(header.map((key, index) => [key, values[index] ?? ''])),
  )
}

export function toBenchmarkRows(records: Record<string, string>[]): BenchmarkRow[] {
  return records.map((record) => {
    const parsed = { ...record } as Record<string, string | number | null>

    for (const column of benchmarkNumericColumns) {
      parsed[column] = parseNumber(record[column])
    }

    return parsed as unknown as BenchmarkRow
  })
}

export function toFoundationRows(records: Record<string, string>[]): FoundationCellRow[] {
  return records.map((record) => {
    const parsed = { ...record } as Record<string, string | number | null>

    for (const column of foundationNumericColumns) {
      parsed[column] = parseNumber(record[column])
    }

    return parsed as unknown as FoundationCellRow
  })
}

export function parseNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function getMetricDefinition(key: DisplayMetricKey): MetricDefinition {
  return metricDefinitions.find((metric) => metric.key === key) ?? metricDefinitions[0]
}

export function getFoundationMetricDefinition(key: FoundationMetricKey): FoundationMetricDefinition {
  return foundationMetricDefinitions.find((metric) => metric.key === key) ?? foundationMetricDefinitions[0]
}

export function average(values: Array<number | null>): number | null {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value))
  if (finite.length === 0) {
    return null
  }

  return finite.reduce((sum, value) => sum + value, 0) / finite.length
}

export function summarizeDatasets(rows: BenchmarkRow[]): DatasetSummary[] {
  const groups = new Map<string, BenchmarkRow[]>()
  for (const row of rows) {
    const key = `${row.dataset}__${row.stain_type}`
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  return [...groups.values()]
    .map((groupRows) => ({
      name: groupRows[0].dataset,
      stain: groupRows[0].stain_type,
      rows: groupRows.length,
      methods: new Set(groupRows.map((row) => row.method_display)).size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function aggregateMethods(rows: BenchmarkRow[]): MethodAggregate[] {
  const groups = new Map<string, BenchmarkRow[]>()

  for (const row of rows) {
    groups.set(row.method_display, [...(groups.get(row.method_display) ?? []), row])
  }

  const aggregates: MethodAggregate[] = [...groups.entries()].map(([method, methodRows]) => {
    const metrics = Object.fromEntries(
      metricKeys.map((key) => [key, average(methodRows.map((row) => row[key]))]),
    ) as Record<MetricKey, number | null>

    return {
      method,
      paradigm: methodRows[0].paradigm,
      rows: methodRows.length,
      score: 0,
      metrics,
    }
  })

  const normalizedByMetric = new Map<MetricKey, Map<string, number>>()
  for (const metricKey of metricKeys) {
    const direction = getMetricDefinition(metricKey).direction
    const values = aggregates
      .map((aggregate) => aggregate.metrics[metricKey])
      .filter((value): value is number => value !== null && Number.isFinite(value))
    const min = Math.min(...values)
    const max = Math.max(...values)
    const scores = new Map<string, number>()

    for (const aggregate of aggregates) {
      const value = aggregate.metrics[metricKey]
      if (value === null || !Number.isFinite(value) || values.length === 0) {
        continue
      }

      const score = max === min ? 1 : direction === 'higher' ? (value - min) / (max - min) : (max - value) / (max - min)
      scores.set(aggregate.method, score)
    }

    normalizedByMetric.set(metricKey, scores)
  }

  return aggregates.map((aggregate) => {
    const metricScores = metricKeys
      .map((metricKey) => normalizedByMetric.get(metricKey)?.get(aggregate.method))
      .filter((value): value is number => value !== undefined && Number.isFinite(value))

    const levelScore = (isCell: boolean) =>
      average(
        metricKeys
          .filter((metricKey) => (getMetricDefinition(metricKey).group === 'Cell semantics') === isCell)
          .map((metricKey) => normalizedByMetric.get(metricKey)?.get(aggregate.method) ?? null),
      )
    const levels = [levelScore(false), levelScore(true)].filter((value): value is number => value !== null)

    return {
      ...aggregate,
      // Image-level and cell-level metrics contribute equally, as in the article.
      score: levels.length === 0 ? (metricScores.length === 0 ? 0 : average(metricScores) ?? 0) : average(levels) ?? 0,
    }
  })
}

export function aggregateFoundationModels(rows: FoundationCellRow[]): FoundationModelAggregate[] {
  const byModel = new Map<string, FoundationCellRow[]>()

  for (const row of rows) {
    byModel.set(row.model_id, [...(byModel.get(row.model_id) ?? []), row])
  }

  return [...byModel.entries()].map(([modelId, modelRows]) => {
    return {
      modelId,
      model: modelRows[0].model_display,
      family: modelRows[0].family,
      pretraining: modelRows[0].pretraining,
      rows: modelRows.length,
      meanPcc: average(modelRows.map((row) => row.cell_pcc)),
      meanAuc: average(modelRows.map((row) => row.cell_auc)),
      meanF1: average(modelRows.map((row) => row.cell_f1)),
      coStainedPcc: average(modelRows.filter((row) => row.stain_type === 'co-stained').map((row) => row.cell_pcc)),
      adjacentPcc: average(modelRows.filter((row) => row.stain_type === 'adjacent').map((row) => row.cell_pcc)),
      runs: modelRows.sort((a, b) => a.dataset_display.localeCompare(b.dataset_display)),
    }
  })
}

export function metricValueForAggregate(aggregate: MethodAggregate, metricKey: DisplayMetricKey): number | null {
  return metricKey === 'overview' ? aggregate.score : aggregate.metrics[metricKey]
}

export function foundationMetricValueForAggregate(
  aggregate: FoundationModelAggregate,
  metricKey: FoundationMetricKey,
): number | null {
  if (metricKey === 'cell_pcc') {
    return aggregate.meanPcc
  }
  if (metricKey === 'cell_auc') {
    return aggregate.meanAuc
  }
  if (metricKey === 'cell_f1') {
    return aggregate.meanF1
  }
  return aggregate.meanPcc
}

export function normalizeForBar(value: number | null, values: Array<number | null>, direction: 'higher' | 'lower'): number {
  if (value === null || !Number.isFinite(value)) {
    return 0
  }

  const finite = values.filter((item): item is number => item !== null && Number.isFinite(item))
  if (finite.length === 0) {
    return 0
  }

  const min = Math.min(...finite)
  const max = Math.max(...finite)
  if (max === min) {
    return 1
  }

  return direction === 'higher' ? (value - min) / (max - min) : (max - value) / (max - min)
}

export function formatMetric(metricKey: DisplayMetricKey, value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'NA'
  }

  if (metricKey === 'overview') {
    return `${Math.round(value * 100)}`
  }

  if (metricKey === 'patch_psnr' || metricKey === 'patch_rmse') {
    return value.toFixed(2)
  }

  return value.toFixed(3)
}

export function formatFoundationMetric(_metricKey: FoundationMetricKey, value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'NA'
  }

  return value.toFixed(3)
}

export function formatNullable(value: number | null, digits = 3): string {
  if (value === null || !Number.isFinite(value)) {
    return 'NA'
  }

  return value.toFixed(digits)
}
