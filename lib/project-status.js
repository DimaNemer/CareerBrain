const PROJECT_STATUS_LABELS = {
  open: 'Open',
  active: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
}

export function getProjectStatusLabel(status) {
  return PROJECT_STATUS_LABELS[status] || status
}
