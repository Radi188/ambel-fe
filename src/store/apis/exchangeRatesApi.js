import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/apiClient';

export const exchangeRatesApi = createApi({
  reducerPath: 'exchangeRatesApi',
  baseQuery:   axiosBaseQuery(),
  tagTypes:    ['ExchangeRate'],
  endpoints:   (builder) => ({

    // GET /exchange-rates/current  (cashier+) — active rate for POS
    getCurrentRate: builder.query({
      query: () => ({ url: '/exchange-rates/current' }),
      providesTags: [{ type: 'ExchangeRate', id: 'CURRENT' }],
    }),

    // GET /exchange-rates  (manager+) — full history
    getExchangeRates: builder.query({
      query: () => ({ url: '/exchange-rates' }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'ExchangeRate', id: _id })), { type: 'ExchangeRate', id: 'LIST' }]
          : [{ type: 'ExchangeRate', id: 'LIST' }],
    }),

    // POST /exchange-rates  body: { rate, effectiveDate?, note? }  (super_admin)
    createExchangeRate: builder.mutation({
      query: (body) => ({ url: '/exchange-rates', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'ExchangeRate', id: 'LIST' }, { type: 'ExchangeRate', id: 'CURRENT' }],
    }),

    // PATCH /exchange-rates/:id  (super_admin)
    updateExchangeRate: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/exchange-rates/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'ExchangeRate', id },
        { type: 'ExchangeRate', id: 'LIST' },
        { type: 'ExchangeRate', id: 'CURRENT' },
      ],
    }),

    // DELETE /exchange-rates/:id  (super_admin)
    deleteExchangeRate: builder.mutation({
      query: (id) => ({ url: `/exchange-rates/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'ExchangeRate', id: 'LIST' }, { type: 'ExchangeRate', id: 'CURRENT' }],
    }),

  }),
});

export const {
  useGetCurrentRateQuery,
  useGetExchangeRatesQuery,
  useCreateExchangeRateMutation,
  useUpdateExchangeRateMutation,
  useDeleteExchangeRateMutation,
} = exchangeRatesApi;
