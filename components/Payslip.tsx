
import React from 'react';
import type { Payroll, Employee } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { NebrasLogo } from './icons/Icons';

interface PayslipProps {
  payroll: Payroll;
  employee: Employee;
  storeName: string;
  onClose: () => void;
}

const Payslip: React.FC<PayslipProps> = ({ payroll, employee, storeName, onClose }) => {
  const payslipRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    const element = payslipRef.current;
    if (element) {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`payslip-${payroll.monthYear}-${employee.username}.pdf`);
    }
  };

  const totalEarnings = payroll.baseSalary + payroll.bonuses;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-100 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800">كشف راتب - {payroll.monthYear}</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">طباعة</button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto">
          <div ref={payslipRef} className="bg-white p-8" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div className="flex items-center gap-2">
                <NebrasLogo />
                <h1 className="text-2xl font-bold">{storeName}</h1>
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-500">كشف راتب</h2>
                <p className="text-sm">لشهر: {payroll.monthYear}</p>
              </div>
            </div>

            {/* Employee Details */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p><strong>اسم الموظف:</strong> {employee.fullName}</p>
                <p><strong>اسم المستخدم:</strong> {employee.username}</p>
              </div>
              <div className="text-left">
                <p><strong>تاريخ الدفع:</strong> {payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString('ar-EG') : '-'}</p>
                <p><strong>الراتب الأساسي:</strong> {payroll.baseSalary.toLocaleString()} ج.م</p>
              </div>
            </div>

            {/* Earnings and Deductions */}
            <div className="grid grid-cols-2 gap-8">
              {/* Earnings */}
              <div>
                <h3 className="text-lg font-bold text-green-700 border-b-2 border-green-200 pb-1 mb-2">الاستحقاقات</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><p>الراتب الأساسي:</p> <p>{payroll.baseSalary.toLocaleString()} ج.م</p></div>
                  <div className="flex justify-between"><p>المكافآت:</p> <p>{payroll.bonuses.toLocaleString()} ج.م</p></div>
                </div>
                <div className="flex justify-between font-bold text-md border-t pt-2 mt-2">
                  <p>إجمالي الاستحقاقات:</p>
                  <p>{totalEarnings.toLocaleString()} ج.م</p>
                </div>
              </div>
              {/* Deductions */}
              <div>
                <h3 className="text-lg font-bold text-red-700 border-b-2 border-red-200 pb-1 mb-2">الاستقطاعات</h3>
                <div className="space-y-1 text-sm">
                  {payroll.deductionDetails.map((ded, i) => (
                     <div key={i} className="flex justify-between">
                        <p>{ded.description}:</p>
                        <p className="text-red-600">({ded.amount.toLocaleString()}) ج.م</p>
                    </div>
                  ))}
                </div>
                 <div className="flex justify-between font-bold text-md border-t pt-2 mt-2">
                  <p>إجمالي الاستقطاعات:</p>
                  <p className="text-red-600">({payroll.totalDeductions.toLocaleString()}) ج.م</p>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="mt-8 pt-4 border-t-4 border-double border-gray-300 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-bold">صافي الراتب المستحق</h3>
              <p className="text-2xl font-bold text-indigo-700">{payroll.netSalary.toLocaleString()} ج.م</p>
            </div>
            
            <div className="text-center mt-6 text-[10px] text-gray-400">
                تم إصدار هذا المستند إلكترونياً بواسطة نظام <span className="font-bold">مزاد بلس</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payslip;