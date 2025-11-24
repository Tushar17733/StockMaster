import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { documentsAPI } from '../../api/documents';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { ConfirmModal } from '../../components/UI/ConfirmModal';
import { Select } from '../../components/UI/Select';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/UI/Table';
import { formatDate, formatCurrency } from '../../utils/helpers';

export const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInventoryManager } = useAuth();
  const [actionModal, setActionModal] = useState({ isOpen: false, action: null, newStatus: null });

  const { data: document, loading, error, execute } = useApi(
    () => documentsAPI.getById(id),
    true,
    [id]
  );

  const handleStatusChange = async (newStatus) => {
    try {
      await documentsAPI.updateStatus(id, newStatus);
      // Refresh document data
      execute();
    } catch (err) {
      // Handle error - show message
      const errorMessage = getUserFriendlyError(err);
      alert(errorMessage); // Could be replaced with toast notification
    }
  };

  const handleAction = async (action) => {
    try {
      if (action === 'validate') {
        await documentsAPI.updateStatus(id, 'DONE');
      } else if (action === 'cancel') {
        await documentsAPI.updateStatus(id, 'CANCELED');
      }
      setActionModal({ isOpen: false, action: null });
      // Refresh document data
      execute();
    } catch (err) {
      // Handle error - show message and keep modal open
      const errorMessage = getUserFriendlyError(err);
      alert(errorMessage); // Could be replaced with toast notification
      setActionModal({ isOpen: false, action: null });
    }
  };

  if (loading) return <Loader size="lg" />;
  if (error) return <Alert type="error" message={error} />;
  if (!document) return <Alert type="error" message="Document not found" />;

  const canValidate = isInventoryManager() && 
    document.status !== 'DONE' && 
    document.status !== 'validated' && 
    document.status !== 'CANCELED' && 
    document.status !== 'cancelled';
  const canCancel = document.status !== 'CANCELED' && 
    document.status !== 'cancelled' && 
    document.status !== 'DONE' && 
    document.status !== 'validated';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Document {document.documentNumber || document.id}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Document Details</p>
        </div>
        <div className="flex space-x-3">
          {isInventoryManager() && (
            <Select
              value={document.status || 'DRAFT'}
              onChange={(e) => {
                const newStatus = e.target.value;
                if (newStatus === 'DONE' || newStatus === 'CANCELED') {
                  setActionModal({ isOpen: true, action: newStatus === 'DONE' ? 'validate' : 'cancel', newStatus });
                } else {
                  handleStatusChange(newStatus);
                }
              }}
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'WAITING', label: 'Waiting' },
                { value: 'READY', label: 'Ready' },
                { value: 'DONE', label: 'Done (Validate)' },
                { value: 'CANCELED', label: 'Canceled' }
              ]}
              className="w-40"
            />
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{document.docType || document.type || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
            <p className="mt-1">
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  document.status === 'DONE' || document.status === 'validated'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : document.status === 'CANCELED' || document.status === 'cancelled'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}
              >
                {document.status || 'DRAFT'}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Document Number</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{document.docNumber || document.documentNumber || document.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(document.scheduledDate || document.date || document.createdAt)}</p>
          </div>
          {document.fromLocation && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">From Location</label>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{document.fromLocation.name} ({document.fromLocation.warehouse?.name || ''})</p>
            </div>
          )}
          {document.toLocation && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">To Location</label>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{document.toLocation.name} ({document.toLocation.warehouse?.name || ''})</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Document Lines</h2>
        </div>
        <Table>
          <TableHeader>
            <TableHeaderCell>Product</TableHeaderCell>
            <TableHeaderCell>SKU</TableHeaderCell>
            <TableHeaderCell>Quantity</TableHeaderCell>
            <TableHeaderCell>From Location</TableHeaderCell>
            <TableHeaderCell>To Location</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {(document.lines || document.stockMoves) && (document.lines || document.stockMoves).length > 0 ? (
              (document.lines || document.stockMoves).map((line, index) => (
                <TableRow key={index}>
                  <TableCell>{line.product?.name || '-'}</TableCell>
                  <TableCell>{line.product?.sku || '-'}</TableCell>
                  <TableCell>{line.quantity || 0}</TableCell>
                  <TableCell>{line.fromLocation?.name || '-'}</TableCell>
                  <TableCell>{line.toLocation?.name || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No lines found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, action: null })}
        onConfirm={() => {
          if (actionModal.action === 'validate' || actionModal.action === 'cancel') {
            handleAction(actionModal.action);
          } else {
            handleStatusChange(actionModal.newStatus);
            setActionModal({ isOpen: false, action: null });
          }
        }}
        title={actionModal.action === 'validate' ? 'Validate Document' : actionModal.action === 'cancel' ? 'Cancel Document' : 'Change Document Status'}
        message={
          actionModal.action === 'validate'
            ? 'Are you sure you want to validate this document? This will update stock quantities.'
            : actionModal.action === 'cancel'
            ? 'Are you sure you want to cancel this document? This action cannot be undone.'
            : `Are you sure you want to change the document status to ${actionModal.newStatus}?`
        }
        variant={actionModal.action === 'cancel' ? 'danger' : 'primary'}
      />
    </div>
  );
};

