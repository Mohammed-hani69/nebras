
import React, { useState, useMemo } from 'react';
import type { Product, Supplier, InventoryMovement, MovementType } from '../types';


interface InventoryProps {
  products: (Product & { quantitySold: number; quantityAvailable: number; })[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  suppliers: Supplier[];
  logActivity: (action: string) => void;
  inventoryMovements: InventoryMovement[];
}

const Inventory: React.FC<InventoryProps> = ({ products, addProduct, suppliers, logActivity, inventoryMovements }) => {
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
      name: '',
      category: 'موبايل' as 'موبايل' | 'إكسسوار',
      costPrice: 0,
      sellPrice: 0,
      initialQuantity: 0,
      supplierId: ''
  });
  
  const [priceWarning, setPriceWarning] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingHistoryFor, setViewingHistoryFor] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedProduct = { ...newProduct, [name]: name.endsWith('Price') || name.endsWith('Quantity') ? parseFloat(value) : value };
    setNewProduct(updatedProduct);

    if (name === 'sellPrice' || name === 'costPrice') {
        if (updatedProduct.sellPrice > 0 && updatedProduct.sellPrice <= updatedProduct.costPrice) {
            setPriceWarning('تحذير: سعر البيع أقل من أو يساوي سعر التكلفة.');
        } else {
            setPriceWarning('');
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.name && newProduct.sellPrice > 0 && newProduct.initialQuantity >= 0 && newProduct.supplierId) {
        addProduct(newProduct);
        setNewProduct({ name: '', category: 'موبايل', costPrice: 0, sellPrice: 0, initialQuantity: 0, supplierId: '' });
        setShowForm(false);
        setPriceWarning('');
    } else {
        alert('الرجاء تعبئة جميع الحقول المطلوبة، بما في ذلك المورد.');
    }
  };
  
  const getSupplierNameById = (id: string) => suppliers.find(s => s.id === id)?.name || 'غير معروف';

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const movementTypeLabels: Record<MovementType, string> = {
      'sale': 'بيع',
      'purchase': 'شراء (استلام)',
      'sale_return': 'مرتجع مبيعات',
      'purchase_return': 'مرتجع مشتريات',
      'initial': 'رصيد افتتاحي',
      'adjustment': 'تعديل مخزني'
  };

  const ProductHistoryModal = () => {
      if (!viewingHistoryFor) return null;
      
      const product = products.find(p => p.id === viewingHistoryFor);
      const history = inventoryMovements
        .filter(m => m.productId === viewingHistoryFor)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-800">سجل حركات المخزون: {product?.name}</h3>
                      <button onClick={() => setViewingHistoryFor(null)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1">
                      <table className="w-full text-right text-sm">
                          <thead className="bg-gray-50 border-b">
                              <tr>
                                  <th className="p-2">التاريخ</th>
                                  <th className="p-2">نوع الحركة</th>
                                  <th className="p-2">الكمية</th>
                                  <th className="p-2">المرجع/ملاحظات</th>
                              </tr>
                          </thead>
                          <tbody>
                              {history.map(item => (
                                  <tr key={item.id} className="border-b hover:bg-gray-50">
                                      <td className="p-2">{new Date(item.date).toLocaleString('ar-EG')}</td>
                                      <td className="p-2">{movementTypeLabels[item.type] || item.type}</td>
                                      <td className={`p-2 font-bold ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                                          {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                                      </td>
                                      <td className="p-2 text-gray-600">
                                          {item.notes}
                                          {item.referenceId && <span className="block text-xs text-gray-400">#{item.referenceId}</span>}
                                      </td>
                                  </tr>
                              ))}
                              {history.length === 0 && (
                                  <tr><td colSpan={4} className="text-center p-4 text-gray-500">لا توجد حركات مسجلة لهذا المنتج.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
                  <div className="p-4 border-t bg-gray-50 text-left">
                      <button onClick={() => setViewingHistoryFor(null)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">إغلاق</button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">المخزون والمنتجات</h1>
        <button 
          id="inventory-add-product-btn"
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          {showForm ? 'إلغاء' : 'إضافة منتج جديد'}
        </button>
      </div>

      {showForm && (
        <div id="inventory-add-form" className="bg-white p-6 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج/الموديل</label>
                    <input type="text" name="name" value={newProduct.name} onChange={handleChange} placeholder="اسم المنتج/الموديل" className="w-full p-2 border rounded" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
                    <select name="category" value={newProduct.category} onChange={handleChange} className="w-full p-2 border rounded">
                      <option value="موبايل">موبايل</option>
                      <option value="إكسسوار">إكسسوار</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                    <select name="supplierId" value={newProduct.supplierId} onChange={handleChange} className="w-full p-2 border rounded" required>
                      <option value="">اختر المورد...</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر التكلفة</label>
                    <input type="number" name="costPrice" value={newProduct.costPrice} onChange={handleChange} placeholder="سعر التكلفة" className="w-full p-2 border rounded" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع</label>
                    <input type="number" name="sellPrice" value={newProduct.sellPrice} onChange={handleChange} placeholder="سعر البيع" className="w-full p-2 border rounded" required />
                     {priceWarning && <p className="text-red-500 text-xs mt-1">{priceWarning}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الكمية الابتدائية</label>
                    <input type="number" name="initialQuantity" value={newProduct.initialQuantity} onChange={handleChange} placeholder="الكمية الابتدائية" className="w-full p-2 border rounded" required />
                </div>
            </div>
            <div className="flex justify-end">
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">حفظ المنتج</button>
            </div>
          </form>
        </div>
      )}

      <div id="inventory-search" className="bg-white p-4 rounded-xl shadow-lg">
        <input
          type="text"
          placeholder="ابحث بالاسم أو الفئة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div id="inventory-table" className="bg-white p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="border-b-2 border-gray-200">
              <tr>
                <th className="p-3">كود المنتج</th>
                <th className="p-3">اسم المنتج</th>
                <th className="p-3">المورد</th>
                <th className="p-3">الفئة</th>
                <th className="p-3">سعر التكلفة</th>
                <th className="p-3">سعر البيع</th>
                <th className="p-3">الكمية المباعة</th>
                <th className="p-3">الكمية المتاحة</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const isCriticalStock = product.quantityAvailable <= 2;
                const isWarningStock = product.quantityAvailable > 2 && product.quantityAvailable <= 5;
                
                let rowClass = 'border-b border-gray-100 transition-colors duration-200';
                if (isCriticalStock) rowClass += ' bg-red-100 hover:bg-red-200';
                else if (isWarningStock) rowClass += ' bg-yellow-100 hover:bg-yellow-200';
                else rowClass += ' hover:bg-gray-50';

                let quantityClass = 'p-3 font-bold';
                if (isCriticalStock) quantityClass += ' text-red-600';
                else if (isWarningStock) quantityClass += ' text-yellow-600';
                else quantityClass += ' text-green-600';

                return (
                  <tr key={product.id} className={rowClass}>
                    <td className="p-3 font-mono">{product.id}</td>
                    <td className="p-3 font-medium text-gray-700">{product.name}</td>
                    <td className="p-3 text-sm text-gray-600">{getSupplierNameById(product.supplierId)}</td>
                    <td className="p-3">{product.category}</td>
                    <td className="p-3">{product.costPrice.toLocaleString()} ج.م</td>
                    <td className="p-3">{product.sellPrice.toLocaleString()} ج.م</td>
                    <td className="p-3">{product.quantitySold}</td>
                    <td className={quantityClass}>{product.quantityAvailable}</td>
                    <td className="p-3">
                        <button 
                            onClick={() => setViewingHistoryFor(product.id)}
                            className="text-blue-600 hover:underline text-sm bg-blue-50 px-3 py-1 rounded-full"
                        >
                            سجل الحركات
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="text-center p-6 text-gray-500">
              {searchTerm ? 'لا توجد منتجات تطابق بحثك.' : 'لا توجد منتجات في المخزون حاليًا.'}
            </div>
          )}
        </div>
      </div>
      
      {viewingHistoryFor && <ProductHistoryModal />}
    </div>
  );
};

export default Inventory;
