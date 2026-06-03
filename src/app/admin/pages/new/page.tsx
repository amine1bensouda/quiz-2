import CustomPageForm from '@/components/Admin/CustomPageForm';

export default function NewCustomPage() {
  return (
    <div className="space-y-6 text-[#eeeaf4]">
      <div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#eeeaf4]">
          New Page
        </h1>
        <p className="text-[rgba(238,234,244,0.55)]">
          Build a custom page with your own HTML and CSS. Published pages are
          indexable by Google.
        </p>
      </div>
      <CustomPageForm />
    </div>
  );
}
