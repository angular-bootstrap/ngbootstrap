import type { Datagrid } from '../datagrid/datagrid.component';

/** Layout-toolbar tools receive the grid from the toolbar host. */
export interface NgbDatagridToolHost {
  bindHostGrid(grid: Datagrid<any>): void;
}

export function resolveDatagridToolGrid(
  gridInput: Datagrid<any> | undefined,
  hostGrid: Datagrid<any> | undefined,
  toolName: string
): Datagrid<any> {
  const resolved = gridInput ?? hostGrid;
  if (!resolved) {
    throw new Error(
      `${toolName}: place inside ngb-datagrid-layout-toolbar with [grid], or pass [grid] on the tool.`
    );
  }
  return resolved;
}
