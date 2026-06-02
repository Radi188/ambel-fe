import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/apiClient';

// All report endpoints accept optional query params: dateFrom?, dateTo?

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery:   axiosBaseQuery(),
  endpoints:   (builder) => ({

    // GET /reports/sales?dateFrom=&dateTo=
    getSalesReport: builder.query({
      query: ({ headers, ...params } = {}) => ({ url: '/reports/sales', params, headers }),
    }),

    // GET /reports/orders?dateFrom=&dateTo=
    getOrdersReport: builder.query({
      query: ({ headers, ...params } = {}) => ({ url: '/reports/orders', params, headers }),
    }),

    // GET /reports/products?dateFrom=&dateTo=
    getProductsReport: builder.query({
      query: ({ headers, ...params } = {}) => ({ url: '/reports/products', params, headers }),
    }),

    // GET /reports/cashiers?dateFrom=&dateTo=
    getCashiersReport: builder.query({
      query: ({ headers, ...params } = {}) => ({ url: '/reports/cashiers', params, headers }),
    }),

    // GET /reports/branches?dateFrom=&dateTo=  (super_admin only)
    getBranchesReport: builder.query({
      query: ({ headers, ...params } = {}) => ({ url: '/reports/branches', params, headers }),
    }),

  }),
});

export const {
  useGetSalesReportQuery,
  useGetOrdersReportQuery,
  useGetProductsReportQuery,
  useGetCashiersReportQuery,
  useGetBranchesReportQuery,
} = reportsApi;
