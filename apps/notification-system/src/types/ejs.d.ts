declare module "ejs" {
  export function render(
    template: string,
    data?: Record<string, unknown>,
  ): string;
  export function renderFile(
    path: string,
    data?: Record<string, unknown>,
  ): Promise<string>;
}
