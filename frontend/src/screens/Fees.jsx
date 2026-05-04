import React, { useState, useEffect } from 'react';
import { feeApi } from '../api/api';
import { Receipt, CreditCard, AlertTriangle, Plus, Search, CheckCircle2 } from 'lucide-react';

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feesRes, summaryRes] = await Promise.all([
        feeApi.getAll(),
        feeApi.getSummary()
      ]);
      setFees(feesRes.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedFee || !payAmount) return;
    
    try {
      const pay = parseFloat(payAmount);
      const updatedFees = fees.map((fee) => {
        if (fee.id !== selectedFee.id) return fee;
        const amount_paid = Math.min(fee.amount_paid + pay, fee.total_fee);
        const balance = Math.max(fee.total_fee - amount_paid, 0);
        const status = balance === 0 ? 'paid' : (new Date(fee.due_date) < new Date() ? 'overdue' : 'partial');
        return { ...fee, amount_paid, balance, status };
      });
      setFees(updatedFees);
      await feeApi.recordPayment(selectedFee.id, pay);
      setShowModal(false);
      setPayAmount('');
      fetchData();
    } catch (err) {
      alert('Payment failed');
    }
  };

  return (
    <div className="fees-container animate-fade-in">
      <header className="page-header">
        <h1>Fee Management</h1>
        <p>Track collections and outstanding balances</p>
      </header>

      {/* Summary Row */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-icon icon-blue"><Receipt /></div>
          <div className="kpi-info">
            <label>Collected</label>
            <div className="value">UGX {summary?.total_collected.toLocaleString()}</div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-icon icon-indigo"><AlertTriangle /></div>
          <div className="kpi-info">
            <label>Outstanding</label>
            <div className="value">UGX {summary?.total_outstanding.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar card">
        <Search size={18} />
        <input type="text" placeholder="Search student or parent name..." />
      </div>

      {/* Fee Cards */}
      <div className="fees-list">
        {loading ? (
          <div className="loading">Loading fee records...</div>
        ) : (
          fees.map(fee => (
            <div key={fee.id} className="fee-card card">
              <div className="fee-header">
                <div className="student-name">
                  <h4>{fee.first_name} {fee.last_name}</h4>
                  <span className={`badge badge-${fee.status}`}>{fee.status}</span>
                </div>
                <div className="total-label">Total: UGX {fee.total_fee.toLocaleString()}</div>
              </div>
              
              <div className="progress-section">
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${(fee.amount_paid / fee.total_fee) * 100}%` }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span>Paid: UGX {fee.amount_paid.toLocaleString()}</span>
                  <span>Bal: <strong>UGX {fee.balance.toLocaleString()}</strong></span>
                </div>
              </div>

              <div className="fee-footer">
                <span className="due-date">Due: {new Date(fee.due_date).toLocaleDateString()}</span>
                <button 
                  className="btn btn-outline"
                  onClick={() => { setSelectedFee(fee); setShowModal(true); }}
                >
                  <CreditCard size={16} /> Pay
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal card animate-fade-in">
            <h3>Record Payment</h3>
            <p>Enter amount paid by {selectedFee.first_name}</p>
            <form onSubmit={handlePayment}>
              <div className="input-group">
                <label className="input-label">Amount (UGX)</label>
                <input 
                  type="number" 
                  className="input-field"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .fees-container { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .search-bar { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; }
        .search-bar input { border: none; outline: none; background: transparent; width: 100%; font-size: 0.9rem; }

        .fees-list { display: grid; gap: 1rem; grid-template-columns: 1fr; }
        @media (min-width: 768px) { .fees-list { grid-template-columns: repeat(2, 1fr); } }

        .fee-card { display: flex; flex-direction: column; gap: 1.5rem; }
        .fee-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .student-name h4 { font-size: 1.1rem; color: #1e293b; margin-bottom: 0.25rem; }
        .total-label { font-size: 0.75rem; color: #64748b; font-weight: 600; }

        .progress-section { display: flex; flex-direction: column; gap: 0.5rem; }
        .progress-bar-bg { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: #4f46e5; border-radius: 4px; transition: width 0.5s ease; }
        .progress-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; }
        .progress-labels strong { color: #1e293b; }

        .fee-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
        .due-date { font-size: 0.75rem; color: #94a3b8; }
        .btn-outline { background: transparent; border: 1.5px solid #e2e8f0; color: #475569; padding: 0.5rem 1rem; font-size: 0.875rem; }
        .btn-outline:hover { background: #f8fafc; border-color: #4f46e5; color: #4f46e5; }

        .modal-overlay {
          position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1.5rem;
          backdrop-filter: blur(4px);
        }
        .modal { width: 100%; max-width: 400px; padding: 2rem; }
        .modal h3 { margin-bottom: 0.5rem; }
        .modal p { color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
        .btn-ghost { background: transparent; color: #64748b; }
      `}} />
    </div>
  );
};

export default Fees;
