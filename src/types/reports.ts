export type ExportType =
  | 'pdf_summary'
  | 'excel_participants'
  | 'excel_matches'
  | 'excel_leaderboard'
  | 'excel_bundle'
  | 'zip_selfies'

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface ExportJob {
  id: number
  event_id: number
  export_type: ExportType
  export_label: string
  status: ExportStatus
  file_name: string | null
  file_size_bytes: number | null
  content_type: string | null
  error_message: string | null
  created_at: string | null
  started_at: string | null
  completed_at: string | null
  download_url: string | null
}

export interface ExportOption {
  type: ExportType
  label: string
  description: string
  format: 'PDF' | 'Excel' | 'ZIP'
  competitionOnly?: boolean
}

export const EXPORT_OPTIONS: ExportOption[] = [
  {
    type: 'pdf_summary',
    label: 'Event summary',
    description: 'Overview metrics, top tasks, and leaderboard snapshot',
    format: 'PDF',
  },
  {
    type: 'excel_participants',
    label: 'Participants',
    description: 'All participants with progress and scores',
    format: 'Excel',
  },
  {
    type: 'excel_matches',
    label: 'Matches',
    description: 'Every scan and connection record',
    format: 'Excel',
  },
  {
    type: 'excel_leaderboard',
    label: 'Leaderboard',
    description: 'Full ranked standings',
    format: 'Excel',
    competitionOnly: true,
  },
  {
    type: 'excel_bundle',
    label: 'Full workbook',
    description: 'Participants, matches, and leaderboard in one file',
    format: 'Excel',
  },
  {
    type: 'zip_selfies',
    label: 'All selfies',
    description: 'ZIP archive of every uploaded selfie image',
    format: 'ZIP',
  },
]
