import AppPageHeader from '@app/dashboard/components/app/app-page-header';
import { DASHBOARD } from '@feature/base/server';
import FileUpload06 from '@app/dashboard/components/file-upload-06';
import ScheduleImport from '@app/dashboard/components/schedule-import';

interface Props {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

async function AppUploadPage(props: Props) {
  const params = await props.params;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <AppPageHeader
        title="Interview Sheet Upload"
        breadcrumbs={[
          { label: 'Home', href: DASHBOARD.href },
          { label: 'Upload', href: '#' },
        ]}
      ></AppPageHeader>
      <ScheduleImport />
    </div>
  );
}

export default AppUploadPage;
