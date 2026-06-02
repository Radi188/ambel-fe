import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../services/apiClient';

// Products  → GET/POST/PATCH/DELETE /api/products
// Categories→ GET/POST/PATCH/DELETE /api/categories

export const menuApi = createApi({
  reducerPath: 'menuApi',
  baseQuery:   axiosBaseQuery(),
  tagTypes:    ['Product', 'Category'],
  endpoints:   (builder) => ({

    // ── Products ────────────────────────────────────────────────
    // GET /products?category=<id>&type=main|topping
    getProducts: builder.query({
      query: (params) => ({ url: '/products', params }),
      providesTags: (result) =>
        result
          ? [...result.map(({ _id }) => ({ type: 'Product', id: _id })), { type: 'Product', id: 'LIST' }]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    // GET /products?type=topping — topping products for customization modal
    getToppings: builder.query({
      query: () => ({ url: '/products', params: { type: 'topping' } }),
      providesTags: [{ type: 'Product', id: 'TOPPINGS' }],
    }),

    getProductById: builder.query({
      query: (id) => ({ url: `/products/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),

    // body: { name, price, category, description?, imageUrl?, isAvailable? }
    // branch is injected server-side from JWT
    createProduct: builder.mutation({
      query: (body) => ({ url: '/products', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),

    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // PATCH /products/:id/branches/add  body: { branchId } — super_admin only
    addProductBranch: builder.mutation({
      query: ({ id, branchId }) => ({ url: `/products/${id}/branches/add`, method: 'PATCH', data: { branchId } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),

    // PATCH /products/:id/branches/remove  body: { branchId } — super_admin only
    removeProductBranch: builder.mutation({
      query: ({ id, branchId }) => ({ url: `/products/${id}/branches/remove`, method: 'PATCH', data: { branchId } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Product', id }, { type: 'Product', id: 'LIST' }],
    }),

    // ── Categories ──────────────────────────────────────────────
    // GET /categories
    getCategories: builder.query({
      query: () => ({ url: '/categories' }),
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    // body: { name, description?, isActive? }
    createCategory: builder.mutation({
      query: (body) => ({ url: '/categories', method: 'POST', data: body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: 'PATCH', data: body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

  }),
});

export const {
  useGetProductsQuery,
  useGetToppingsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useAddProductBranchMutation,
  useRemoveProductBranchMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = menuApi;
