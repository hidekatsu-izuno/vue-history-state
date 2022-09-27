import { HistoryState, HistoryItem, HistoryLocationRaw } from './history_state'

export class ServerHistoryState implements HistoryState {
  private _action = 'navigate'

  constructor(
    public options: Record<string, any>
  ) {
  }

  /**
   * @internal
   */
  _init(context: Record<string, any>) {
    const req = context.req
    if (!req) {
      return
    }

    if (req.headers) {
      const cacheControl = req.headers['cache-control'] || req.headers['pragma'];
      if (/^(no-cache|max-age=0)$/.test(cacheControl)) {
        this._action = 'reload'
      }
    }
  }

  get action() {
    return this._action;
  }

  get page() {
    return 0
  }

  get data() {
    return undefined;
  }

  get length(): number {
    throw new Error('length is not supported on server.');
  }

  getItem(page: number): HistoryItem | undefined {
    throw new Error('getItem is not supported on server.');
  }

  getItems(): Array<HistoryItem> {
    throw new Error('getItems is not supported on server.');
  }

  clearItemData(page: number): HistoryItem | undefined {
    throw new Error('clearItemData is not supported on server.');
  }

  findBackPage(location: HistoryLocationRaw): number {
    throw new Error('findBackPosition is not supported on server.');
  }
}
