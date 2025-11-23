import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { documentsAPI } from '../../api/documents';
import { productsAPI } from '../../api/products';
import { locationsAPI } from '../../api/locations';
import { useApi } from '../../hooks/useApi';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Input } from '../../components/UI/Input';
import { Select } from '../../components/UI/Select';
import { Button } from '../../components/UI/Button';
import { Alert } from '../../components/UI/Alert';
import { Loader } from '../../components/UI/Loader';
import { formatCurrency } from '../../utils/helpers';

export const DocumentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const { data: productsData } = useApi(
    () => productsAPI.getAll({ search: productSearch, limit: 20 }),
    productSearch.length > 0 || !isEdit
  );
  const { data: locationsData } = useApi(() => locationsAPI.getAll(), true);
  const { data: documentData, loading: documentLoading } = useApi(
    () => documentsAPI.getById(id),
    isEdit,
    [id]
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      docType: 'RECEIPT',
      status: 'DRAFT',
      lines: [{ productId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const docType = watch('docType');

  useEffect(() => {
    if (documentData && isEdit) {
      reset({
        docType: documentData.docType || documentData.type || 'RECEIPT',
        status: documentData.status || 'DRAFT',
        fromLocationId: documentData.fromLocationId || documentData.from_location_id,
        toLocationId: documentData.toLocationId || documentData.to_location_id,
        supplierName: documentData.supplierName || documentData.supplier_name,
        customerName: documentData.customerName || documentData.customer_name,
        scheduledDate: documentData.scheduledDate || documentData.scheduled_date,
        lines: (documentData.lines || documentData.stockMoves || []).map(line => ({
          productId: line.productId || line.product_id || line.product?.id,
          quantity: line.quantity || 1,
        })),
      });
    }
  }, [documentData, isEdit, reset]);

  const onSubmit = async (data) => {
    setError(null);
    setLoading(true);
    try {
      const documentData = {
        docType: data.docType,
        status: data.status || 'DRAFT',
        fromLocationId: data.fromLocationId ? parseInt(data.fromLocationId) : undefined,
        toLocationId: data.toLocationId ? parseInt(data.toLocationId) : undefined,
        supplierName: data.supplierName,
        customerName: data.customerName,
        scheduledDate: data.scheduledDate,
        lines: data.lines.map(line => ({
          productId: parseInt(line.productId),
          quantity: parseFloat(line.quantity),
        })),
      };

      if (isEdit) {
        await documentsAPI.update(id, documentData);
      } else {
        await documentsAPI.create(documentData);
      }
      // Success - redirect to documents list
      navigate('/documents', { replace: true });
    } catch (err) {
      // Handle error with user-friendly message
      const errorMessage = getUserFriendlyError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const productOptions =
    productsData?.data?.map((product) => ({
      value: product.id,
      label: `${product.name} (${product.sku || 'N/A'})`,
    })) || [];

  const locationOptions =
    locationsData?.data?.map((location) => ({
      value: location.id,
      label: `${location.name} - ${location.warehouse?.name || ''}`,
    })) || [];

  const documentTypeOptions = [
    { value: 'RECEIPT', label: 'Receipt (Stock In)' },
    { value: 'DELIVERY', label: 'Delivery (Stock Out)' },
    { value: 'INTERNAL_TRANSFER', label: 'Internal Transfer' },
    { value: 'ADJUSTMENT', label: 'Stock Adjustment' },
  ];

  if (documentLoading && isEdit) return <Loader size="lg" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isEdit ? 'Edit Document' : 'New Document'}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert type="error" message={error} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Select
              label="Document Type"
              name="docType"
              register={register}
              error={errors.docType}
              options={documentTypeOptions}
              rules={{ required: 'Document type is required' }}
            />
            <Input
              label="Scheduled Date"
              name="scheduledDate"
              type="datetime-local"
              register={register}
              error={errors.scheduledDate}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {(docType === 'RECEIPT' || docType === 'INTERNAL_TRANSFER' || docType === 'ADJUSTMENT') && (
              <Select
                label="To Location"
                name="toLocationId"
                register={register}
                error={errors.toLocationId}
                options={locationOptions}
                rules={docType === 'RECEIPT' || docType === 'INTERNAL_TRANSFER' ? { required: 'To location is required' } : {}}
              />
            )}
            {(docType === 'DELIVERY' || docType === 'INTERNAL_TRANSFER' || docType === 'ADJUSTMENT') && (
              <Select
                label="From Location"
                name="fromLocationId"
                register={register}
                error={errors.fromLocationId}
                options={locationOptions}
                rules={docType === 'DELIVERY' || docType === 'INTERNAL_TRANSFER' ? { required: 'From location is required' } : {}}
              />
            )}
            {docType === 'RECEIPT' && (
              <Input
                label="Supplier Name"
                name="supplierName"
                register={register}
                error={errors.supplierName}
              />
            )}
            {docType === 'DELIVERY' && (
              <Input
                label="Customer Name"
                name="customerName"
                register={register}
                error={errors.customerName}
              />
            )}
          </div>

          <div className="mb-6">
            <div className="mb-4">
              <label className="label">Search Products</label>
              <input
                type="text"
                className="input-field"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Type to search products..."
              />
            </div>
            <label className="label">Document Lines</label>
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Select
                      label="Product"
                      name={`lines.${index}.productId`}
                      register={register}
                      error={errors.lines?.[index]?.productId}
                      options={productOptions}
                      rules={{ required: 'Product is required' }}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Input
                      label="Quantity"
                      name={`lines.${index}.quantity`}
                      type="number"
                      step="0.01"
                      register={register}
                      error={errors.lines?.[index]?.quantity}
                      rules={{ required: 'Quantity is required', min: { value: 0.01, message: 'Must be greater than 0' } }}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        className="mb-0"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ productId: '', quantity: 1 })}
            >
              Add Line
            </Button>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/documents')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader size="sm" /> : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

