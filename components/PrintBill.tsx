
import React from 'react';
import { Bill, Settings } from '../types';
import { APP_CONFIG } from '../constants';

interface PrintBillProps {
  bill: Bill;
  settings: Settings;
}

const PrintBill: React.FC<PrintBillProps> = ({ bill, settings }) => {
  const isThermal = settings.printerType === '80mm';
  
  return (
    <div className={`print-container ${isThermal ? 'thermal-layout' : 'a4-layout'}`}>
      <style>{`
        .print-container {
          font-family: 'Courier New', Courier, monospace;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 0;
        }
        
        @media screen {
          .print-container {
            display: none;
          }
        }
        
        @media print {
          .print-container {
            display: block !important;
          }
          @page {
            margin: 0;
            size: ${isThermal ? '80mm auto' : 'A4'};
          }
          body {
            -webkit-print-color-adjust: exact;
          }
        }

        .thermal-layout {
          width: 72mm;
          padding: 4mm;
          margin: 0 auto;
        }

        .a4-layout {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 5mm;
        }

        .biz-name {
          font-size: 18px;
          font-weight: 900;
          margin: 0;
          text-transform: uppercase;
        }

        .biz-details {
          font-size: 10px;
          line-height: 1.2;
          margin-top: 2px;
        }

        .divider {
          border-top: 1px dashed #000;
          margin: 3mm 0;
        }

        .bill-info {
          font-size: 11px;
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
        }

        .item-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin: 3mm 0;
        }

        .item-table th {
          text-align: left;
          border-bottom: 1px dashed #000;
          padding: 1mm 0;
        }

        .item-table td {
          padding: 1.5mm 0;
          vertical-align: top;
        }

        .item-name {
          width: 50%;
        }

        .qty-rate {
          text-align: center;
          width: 25%;
        }

        .amount {
          text-align: right;
          width: 25%;
        }

        .totals {
          font-size: 12px;
          margin-top: 2mm;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
        }

        .grand-total {
          font-size: 16px;
          font-weight: 900;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 2mm 0;
          margin-top: 2mm;
        }

        .footer {
          text-align: center;
          font-size: 10px;
          margin-top: 8mm;
          line-height: 1.4;
        }

        .cust-info {
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 3mm;
        }
      `}</style>

      <div className="header">
        <h1 className="biz-name">{settings.businessName}</h1>
        <div className="biz-details">
          {settings.businessTagline && <div>{settings.businessTagline}</div>}
          {settings.businessAddress}
          <div>Ph: {settings.businessPhone}</div>
          {settings.gstNumber && <div>GST: {settings.gstNumber}</div>}
        </div>
      </div>

      <div className="divider"></div>

      <div className="bill-info">
        <span>BILL: #{bill.billNumber}</span>
        <span>DATE: {new Date(bill.date).toLocaleDateString()}</span>
      </div>
      <div className="bill-info">
        <span>TYPE: {bill.orderType || 'Dine-In'}</span>
        <span>TIME: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>

      <div className="divider"></div>
      
      <div className="cust-info">
        <div>AC: {bill.companyName}</div>
        <div>ST: {bill.employeeName}</div>
      </div>

      <table className="item-table">
        <thead>
          <tr>
            <th className="item-name">ITEM</th>
            <th className="qty-rate">QTY</th>
            <th className="amount">AMT</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, idx) => (
            <tr key={idx}>
              <td className="item-name">
                {item.name}
                <div style={{fontSize: '9px', color: '#555'}}>@ {item.price.toFixed(2)}</div>
              </td>
              <td className="qty-rate">{item.quantity}</td>
              <td className="amount">{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="divider"></div>

      <div className="totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>{APP_CONFIG.currency_symbol}{bill.subtotal.toFixed(2)}</span>
        </div>
        {bill.tax > 0 && (
          <div className="total-row">
            <span>Tax:</span>
            <span>{APP_CONFIG.currency_symbol}{bill.tax.toFixed(2)}</span>
          </div>
        )}
        <div className="total-row grand-total">
          <span>GRAND TOTAL:</span>
          <span>{APP_CONFIG.currency_symbol}{bill.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="footer">
        <div>MODE: {bill.paymentMethod || 'CASH'}</div>
        <div style={{marginTop: '4mm', fontStyle: 'italic'}}>{settings.thankYouMessage}</div>
        <div style={{marginTop: '2mm'}}>{settings.footerNote}</div>
        <div style={{marginTop: '4mm', fontSize: '8px'}}>System Generated by ProBill</div>
      </div>
    </div>
  );
};

export default PrintBill;
