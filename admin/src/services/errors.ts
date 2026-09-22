/** 统一业务/HTTP 错误：code 为业务码（HTTP 错误时与 status 一致），status 为 HTTP 状态码（网络错误为 0） */
export class ApiError extends Error {
  readonly code: number
  readonly status: number

  constructor(message: string, code: number, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }

  get isUnauthorized(): boolean {
    return this.code === 401 || this.status === 401
  }
}
