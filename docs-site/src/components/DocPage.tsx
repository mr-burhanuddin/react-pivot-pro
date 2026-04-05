interface DocPageProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function DocPage({ title, subtitle, children }: DocPageProps) {
  return (
    <>
      <h1>{title}</h1>
      <p className="subtitle">{subtitle}</p>
      <div className="doc-content">{children}</div>
    </>
  );
}
