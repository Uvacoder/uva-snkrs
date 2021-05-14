import React from 'react';
import { Prisma } from '@prisma/client';
import type { HeadersFunction, LoaderFunction } from 'remix';
import { Link, useRouteData } from 'remix';
import type { Except } from 'type-fest';
import { json } from 'remix-utils';

import { formatDate } from '../utils/format-date';
import { getCloudinaryURL } from '../utils/cloudinary';
import { formatMoney } from '../utils/format-money';
import { copy } from '../utils/copy';
import { sessionKey } from '../constants';
import { prisma } from '../db';
import { withSession } from '../lib/with-session';

const sneakerWithUser = Prisma.validator<Prisma.SneakerArgs>()({
  include: {
    brand: true,
    user: {
      select: {
        id: true,
        fullName: true,
        username: true,
      },
    },
  },
});

type SneakerWithUser = Except<
  Prisma.SneakerGetPayload<typeof sneakerWithUser>,
  'soldDate' | 'purchaseDate' | 'updatedAt' | 'createdAt'
> & {
  soldDate?: string;
  purchaseDate: string;
  updatedAt: string;
  createdAt: string;
};

type RouteData =
  | {
      sneaker: SneakerWithUser;
      id: string;
      userCreatedSneaker: boolean;
    }
  | {
      id: string;
      sneaker?: never;
      userCreatedSneaker?: never;
    };

const headers: HeadersFunction = ({ loaderHeaders }) => ({
  'Cache-Control': loaderHeaders.get('Cache-Control') ?? 'no-cache',
});

const loader: LoaderFunction = ({ params, request }) =>
  withSession(request, async session => {
    const sneaker = await prisma.sneaker.findUnique({
      where: { id: params.sneakerId },
      include: {
        brand: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!sneaker) {
      return json<RouteData>({ id: params.sneakerId }, { status: 404 });
    }

    const userCreatedSneaker = sneaker?.user.id === session.get(sessionKey);

    return json<RouteData>(
      {
        sneaker: {
          ...sneaker,
          createdAt: sneaker.createdAt.toISOString(),
          soldDate: sneaker.soldDate?.toISOString(),
          purchaseDate: sneaker.purchaseDate?.toISOString(),
          updatedAt: sneaker.updatedAt?.toISOString(),
        },
        id: params.sneakerId,
        userCreatedSneaker,
      },
      {
        headers: {
          'Cache-Control': `max-age=300, s-maxage=31536000, stale-while-revalidate=31536000`,
        },
      }
    );
  });

const meta = ({ data }: { data: RouteData }) => {
  if (!data.sneaker) {
    return {
      title: 'Sneaker Not Found',
    };
  }

  const date = formatDate(data.sneaker.purchaseDate, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const description = `${data.sneaker.user.fullName} bought the ${data.sneaker.brand.name} ${data.sneaker.model} on ${date}`;

  return {
    title: `${data.sneaker.brand.name} ${data.sneaker.model} – ${data.sneaker.colorway}`,
    description,
  };
};

function getEmoji(purchase: number, retail: number) {
  const diff = retail - purchase;

  if (diff >= 10000) return '💎';
  if (diff >= 5000) return '💪';
  if (diff >= 2500) return '🥳';
  if (diff >= 1000) return '😎';
  if (diff >= 500) return '😄';
  if (diff <= 500) return '😕';
  if (diff <= 1000) return '☹️';
  if (diff <= 2500) return '😭';
  return '🤯';
}

const SneakerPage: React.VFC = () => {
  const { sneaker, id, userCreatedSneaker } = useRouteData<RouteData>();

  if (!sneaker) {
    return (
      <div className="flex items-center justify-center w-full h-full text-lg text-center">
        <p>No sneaker with id &quot;{id}&quot;</p>
      </div>
    );
  }

  const title = `${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`;
  const purchaseDate = new Date(sneaker.purchaseDate);

  const atRetail = sneaker.retailPrice === sneaker.price;
  const emoji = getEmoji(sneaker.price, sneaker.retailPrice);

  const image1x = getCloudinaryURL(sneaker.imagePublicId, {
    width: '200',
    crop: 'pad',
  });
  const image2x = getCloudinaryURL(sneaker.imagePublicId, {
    width: '400',
    crop: 'pad',
  });
  const image3x = getCloudinaryURL(sneaker.imagePublicId, {
    width: '600',
    crop: 'pad',
  });

  return (
    <main className="container h-full p-4 pb-6 mx-auto">
      <Link to="/">Back</Link>
      <div className="grid grid-cols-1 gap-4 pt-4 sm:gap-8 sm:grid-cols-2">
        <div className="relative" style={{ paddingBottom: '100%' }}>
          <img
            src={image2x}
            srcSet={`${image1x} 1x, ${image2x} 2x, ${image3x} 3x`}
            alt={title}
            height={1200}
            width={1200}
            className="absolute inset-0 overflow-hidden rounded-md"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl">{title}</h1>

            {atRetail ? (
              <p className="text-xl">{formatMoney(sneaker.price)}</p>
            ) : (
              <p className="text-xl">
                Bought {sneaker.retailPrice > sneaker.price ? 'below' : 'above'}{' '}
                retail ({formatMoney(sneaker.retailPrice)}) {emoji} for{' '}
                {formatMoney(sneaker.price)}
              </p>
            )}

            <p className="text-md">
              Purchased on{' '}
              <time dateTime={purchaseDate.toISOString()}>
                {formatDate(purchaseDate)}
              </time>
            </p>

            <p>
              Last Updated{' '}
              <time dateTime={new Date(sneaker.updatedAt).toISOString()}>
                {formatDate(sneaker.updatedAt)}
              </time>
            </p>

            {sneaker.sold && sneaker.soldDate && (
              <p className="text-md">
                Sold{' '}
                <time dateTime={sneaker.soldDate}>
                  {formatDate(sneaker.soldDate)}{' '}
                  {sneaker.soldPrice && (
                    <>For {formatMoney(sneaker.soldPrice)}</>
                  )}
                </time>
              </p>
            )}

            <Link
              to={`/${sneaker.user.username}/yir/${purchaseDate.getFullYear()}`}
              className="block text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
            >
              See others purchased in {purchaseDate.getFullYear()}
            </Link>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              className="text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
              onClick={() => {
                if (navigator.share) {
                  const date = formatDate(purchaseDate, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return navigator.share({
                    title: `${sneaker.brand.name} ${sneaker.model} – ${sneaker.colorway}`,
                    text: `${sneaker.user.fullName} bought the ${sneaker.brand.name} ${sneaker.model} on ${date}`,
                    url: location.href,
                  });
                }

                return copy(location.href);
              }}
            >
              Permalink
            </button>
            {userCreatedSneaker && (
              <Link
                to={`/sneakers/${sneaker.id}/edit`}
                className="inline-block text-blue-600 transition-colors duration-75 ease-in-out hover:text-blue-900 hover:underline"
              >
                Edit Sneaker
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SneakerPage;
export { headers, meta, loader };
