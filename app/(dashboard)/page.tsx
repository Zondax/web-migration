import SynchronizeButton from '@/components/SynchronizeButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductsTable from './products-table';

async function ProductsPage(props: {
  searchParams: Promise<{ q: string; offset: string }>;
}) {
  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="archived" className="hidden sm:flex">
            Archived
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <SynchronizeButton />
        </div>
      </div>
      <TabsContent value="all">
        <ProductsTable />
      </TabsContent>
    </Tabs>
  );
}
export default ProductsPage;
