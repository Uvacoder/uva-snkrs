import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { Sneaker } from '@prisma/client';
import { SimpleImg } from 'react-simple-img';
import { useFormik } from 'formik';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import { formatMoney } from 'src/utils/format-money';
import { getCloudinaryURL } from 'src/utils/cloudinary';
import { formatDate } from 'src/utils/format-date';
import { useUser } from 'src/hooks/use-user';

interface SneakerISODate extends Omit<Sneaker, 'purchaseDate' | 'soldDate'> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  purchaseDate: string | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  soldDate: string | null;
}

interface Props {
  sneaker?: SneakerISODate;
  id?: string;
}

const SneakerPage: NextPage<Props> = () => {
  const router = useRouter();
  const { user } = useUser({ redirectTo: `/login?continue=${router.asPath}` });
  const { id } = router.query;
  const { data: sneaker } = useSWR<SneakerISODate>(
    id ? `/api/sneakers/${id}` : null
  );

  const form = useFormik({
    enableReinitialize: true,
    initialValues: {
      model: sneaker?.model,
      colorway: sneaker?.colorway,
      brand: sneaker?.brand,
      size: sneaker?.size,
      imagePublicId: sneaker?.imagePublicId,
      price: sneaker?.price,
      retailPrice: sneaker?.retailPrice,
      purchaseDate: sneaker?.purchaseDate?.slice(0, 16),
    },
    onSubmit: async values => {
      const promise = await fetch(`/api/sneakers/${id}/edit`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (promise.ok) {
        router.push('/sneakers/[id]', `/sneakers/${id}`);
      }
    },
  });

  if (!user || user.isLoggedIn === false) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        loading...
      </div>
    );
  }

  if (!sneaker) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `${sneaker.brand} ${sneaker.model} – ${sneaker.colorway}`;

  const description = `Logan bought the ${sneaker.brand} ${sneaker.model}${
    sneaker.purchaseDate &&
    ` on ${formatDate(sneaker.purchaseDate, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })}`
  }`;

  const { imagePublicId } = sneaker;
  const image1x = getCloudinaryURL(imagePublicId, { width: 400, crop: 'pad' });
  const image2x = getCloudinaryURL(imagePublicId, { width: 800, crop: 'pad' });
  const image3x = getCloudinaryURL(imagePublicId, { width: 1200, crop: 'pad' });

  return (
    <main className="container h-full p-4 mx-auto">
      <NextSeo
        title={title}
        description={description}
        openGraph={{
          title,
          images: [
            {
              url: image1x,
              alt: title,
              width: 400,
              height: 400,
            },
            {
              url: image2x,
              alt: title,
              width: 400,
              height: 400,
            },
            {
              url: image3x,
              alt: title,
              width: 1200,
              height: 1200,
            },
          ],
        }}
      />
      <Link href="/sneakers/[id]" as={`/sneakers/${sneaker.id}`}>
        <a>Back</a>
      </Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <SimpleImg
          src={image1x}
          srcSet={`${image1x} 1x, ${image2x} 2x, ${image3x} 3x`}
          alt={title}
          height={200}
          width={200}
          applyAspectRatio
          className="w-full h-full overflow-hidden rounded-md"
        />
        <div>
          <h1 className="text-2xl">{title}</h1>
          <p className="text-xl">{formatMoney(sneaker.price)}</p>
          {sneaker.purchaseDate && (
            <p>
              <time className="text-md" dateTime={sneaker.purchaseDate}>
                Purchased {formatDate(sneaker.purchaseDate)}
              </time>
            </p>
          )}
        </div>
      </div>
      <div>
        <h2 className="py-4 text-lg">Edit Sneaker:</h2>
        <form className="space-y-4" onSubmit={form.handleSubmit}>
          <div className="grid items-start gap-2 sm:grid-cols-2">
            <input
              className="p-1 border border-2 border-gray-200 rounded appearance-none"
              type="text"
              value={form.values.brand}
              onChange={form.handleChange}
              placeholder="Brand"
              name="brand"
            />
            <input
              className="p-1 border border-2 border-gray-200 rounded appearance-none"
              type="text"
              value={form.values.model}
              onChange={form.handleChange}
              placeholder="Model"
              name="model"
            />
            <input
              className="p-1 border border-2 border-gray-200 rounded appearance-none"
              type="text"
              value={form.values.colorway}
              onChange={form.handleChange}
              placeholder="Colorway"
              name="colorway"
            />
            <input
              className="p-1 border border-2 border-gray-200 rounded appearance-none"
              type="number"
              value={form.values.price}
              onChange={form.handleChange}
              placeholder="Price"
              name="price"
            />
            <input
              className="p-1 border border-2 border-gray-200 rounded appearance-none"
              type="number"
              value={form.values.retailPrice}
              onChange={form.handleChange}
              placeholder="Retail Price"
              name="retailPrice"
            />
            <input
              className="p-1 border border-2 border-gray-200 rounded appearance-none"
              type="datetime-local"
              value={form.values.purchaseDate}
              onChange={form.handleChange}
              placeholder="Purchase Date"
              name="purchaseDate"
            />
          </div>
          <button
            disabled={!form.isValid || form.isSubmitting}
            type="submit"
            className="self-start w-auto px-4 py-2 text-left text-white bg-blue-500 rounded disabled:bg-blue-200 disabled:cursor-not-allowed"
          >
            Sav{form.isSubmitting ? 'ing' : 'e'} Changes
          </button>
        </form>
      </div>
    </main>
  );
};

export default SneakerPage;