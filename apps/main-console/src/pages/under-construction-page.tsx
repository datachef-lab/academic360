type UnderConstructionPageProps = {
  /** Headline shown in the card. Defaults to the generic app-wide message. */
  title?: string;
  /** Optional supporting copy rendered under the headline. */
  description?: string;
};

export default function UnderConstructionPage({
  title = "This page is under construction!",
  description,
}: UnderConstructionPageProps = {}) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="border p-4 max-w-2xl">
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
