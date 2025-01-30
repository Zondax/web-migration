'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { observer } from '@legendapp/state/react';
import { uiState$ } from 'app/state/ui';
import Product from './product';

function ProductsTable() {
  // function prevPage() {
  //   router.back();
  // }

  // function nextPage() {
  //   router.push(`/?offset=${offset}`, { scroll: false });
  // }
  const apps = uiState$.apps.apps;
  const status = uiState$.apps.status.get();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supported Parachains</CardTitle>
        <CardDescription>
          Please select the accounts you wish to synchronize, or choose to
          synchronize all accounts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"> </TableHead>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Addresses</TableHead>
              <TableHead>Total Balance</TableHead>
              {/* <TableHead className="hidden md:table-cell">Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.length ? (
              apps.map((product) => (
                <Product key={product.id.get()} app={product} />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {status === 'synchronized'
                    ? 'No accounts to migrate'
                    : 'No synchronized accounts'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {/* <CardFooter>
        <form className="flex items-center w-full justify-between">
          <div className="text-xs text-muted-foreground">
            Showing{' '}
            <strong>
              {Math.max(
                0,
                Math.min(offset - productsPerPage, totalProducts) + 1
              )}
              -{offset}
            </strong>{' '}
            of <strong>{totalProducts}</strong> products
          </div>
          <div className="flex">
            <Button
              formAction={prevPage}
              variant="ghost"
              size="sm"
              type="submit"
              disabled={offset === productsPerPage}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Prev
            </Button>
            <Button
              formAction={nextPage}
              variant="ghost"
              size="sm"
              type="submit"
              disabled={offset + productsPerPage > totalProducts}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardFooter> */}
    </Card>
  );
}

export default observer(ProductsTable);
