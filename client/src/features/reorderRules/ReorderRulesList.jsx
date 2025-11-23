import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { reorderRulesAPI } from '../../api/reorderRules';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFriendlyError } from '../../utils/errorHandler';
import { Table, TableHeader, TableHeaderCell, TableBody, TableRow, TableCell } from '../../components/UI/Table';
import { Button } from '../../components/UI/Button';
import { Loader } from '../../components/UI/Loader';
import { Alert } from '../../components/UI/Alert';
import { ConfirmModal } from '../../components/UI/ConfirmModal';
import { Input } from '../../components/UI/Input';
import { formatDate } from '../../utils/helpers';

export const ReorderRulesList = () => {
  const { isInventoryManager } = useAuth();
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, ruleId: null });
  const [searchTerm, setSearchTerm] = useState('');

  const { data, loading, error, execute } = useApi(() => reorderRulesAPI.getAll(), true);

  const [deleteError, setDeleteError] = useState(null);

  const handleDelete = async () => {
    if (deleteModal.ruleId) {
      setDeleteError(null);
      try {
        await reorderRulesAPI.delete(deleteModal.ruleId);
        setDeleteModal({ isOpen: false, ruleId: null });
        execute(); // Refresh list
      } catch (err) {
        const errorMessage = getUserFriendlyError(err);
        setDeleteError(errorMessage);
      }
    }
  };

  if (loading && !data) return <Loader size="lg" />;
  if (error) return <Alert type="error" message={error} />;

  const rules = data?.data || [];
  const filteredRules = rules.filter((rule) =>
    rule.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reorder Rules</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage automatic reorder rules</p>
        </div>
        {isInventoryManager() && (
          <Link to="/reorder-rules/new">
            <Button>Add Reorder Rule</Button>
          </Link>
        )}
      </div>

      <div className="mb-4">
        <Input
          label="Search Reorder Rules"
          name="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by product name or SKU..."
        />
      </div>

      <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableHeaderCell>Product</TableHeaderCell>
            <TableHeaderCell>Min Quantity</TableHeaderCell>
            <TableHeaderCell>Preferred/Max Quantity</TableHeaderCell>
            <TableHeaderCell>Current Stock</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            {isInventoryManager() && <TableHeaderCell>Actions</TableHeaderCell>}
          </TableHeader>
          <TableBody>
            {filteredRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isInventoryManager() ? 7 : 6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No reorder rules found matching your search' : 'No reorder rules found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredRules.map((rule) => {
                const currentQty = rule.currentTotalQty || rule.current_total_qty || rule.product?.totalQuantity || 0;
                const minQty = rule.minQty || rule.minQuantity || 0;
                const preferredQty = rule.preferredQty || rule.preferredQuantity || rule.maxQty || rule.maxQuantity || 0;
                const isLowStock = currentQty < minQty;
                
                return (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.product?.name || '-'}</TableCell>
                    <TableCell>{minQty}</TableCell>
                    <TableCell>{preferredQty || '-'}</TableCell>
                    <TableCell>{currentQty}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          isLowStock
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}
                      >
                        {isLowStock ? 'Low Stock' : 'OK'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(rule.createdAt)}</TableCell>
                    {isInventoryManager() && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link to={`/reorder-rules/${rule.id}/edit`}>
                            <Button variant="secondary" className="text-xs py-1 px-2">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            className="text-xs py-1 px-2"
                            onClick={() => setDeleteModal({ isOpen: true, ruleId: rule.id })}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          setDeleteModal({ isOpen: false, ruleId: null });
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        title="Delete Reorder Rule"
        message={
          deleteError 
            ? <Alert type="error" message={deleteError} />
            : "Are you sure you want to delete this reorder rule? This action cannot be undone."
        }
        variant="danger"
      />
    </div>
  );
};

