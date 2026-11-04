import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='app/director-lesson7-simulator.tsx';
const original=readFileSync(path,'utf8');
assert.equal(createHash('sha1').update(`blob ${Buffer.byteLength(original)}\0`).update(original).digest('hex'),'dcf86860ef506bf25dbe1e193e65088cc6947504','Lesson source changed; manual review required');
let source=original;
function replaceOnce(before,after){assert.equal(source.split(before).length-1,1,`Expected one anchor: ${before.slice(0,80)}`);source=source.replace(before,after);}
replaceOnce('Luna opened “2. Director approval” just below “Refund credit history”. Tick “I approve this return credit and the amount EMS owes the customer.” and click “Approve refund credit”.','Open “Director Approval”, choose “Customer credits”, and find Riverside Family Clinic’s RCN-00001 for GYD 10950.00. Click “Review customer credit”, check the details, tick the approval confirmation and click “Approve and post customer credit”. Luna then returns you to Customer Returns.');
replaceOnce('save the refund credit, then approve it under “2. Director approval”.','save the refund credit. Open Director Approval → Customer credits, review St. Jude’s saved credit and confirm “Approve and post customer credit”. Luna then returns you to Customer Returns.');
replaceOnce('Then tick “I approve this return credit and the amount EMS owes the customer.” and click “Approve refund credit”','Then open Director Approval → Customer credits, find St. Jude’s draft, click “Review customer credit”, tick the approval confirmation and click “Approve and post customer credit”');
replaceOnce('Luna only lets goods ship once the invoice is fully paid, so every return you handle is on a sale the customer has already paid for.','This lesson covers fully paid native-GYD customer invoices. Legacy invoices require separately reviewed handling.');
replaceOnce('Correct. The decision only controls restocking. Any decision other than “Keep on hold” unlocks “Review refund credit” and “Record customer refund”.','Correct. A final inspection permits financial review; it does not approve compensation. Prepare the refund credit, obtain Director approval in Director Approval → Customer credits, and only then record a payment that actually occurred.');
replaceOnce('  const [chosenCredit, setChosenCredit] = useState<string | null>(null);','  const [approvalCreditsOpen, setApprovalCreditsOpen] = useState(false);\n  const [chosenCredit, setChosenCredit] = useState<string | null>(null);');
const button='<button type="button" className="lsim-pbtn" disabled={!creditConfirmed} onClick={() => creditAction("post", rc)}>Approve refund credit</button>';
const buttonIndex=source.indexOf(button);assert.ok(buttonIndex>=0,'Inline approval button missing');
const panelStart=source.lastIndexOf('<section',buttonIndex);const panelEnd=source.indexOf('</section>',buttonIndex)+10;
assert.ok(panelStart>=0&&panelEnd>buttonIndex,'Approval panel bounds missing');
const oldPanel=source.slice(panelStart,panelEnd);assert.ok(oldPanel.includes('2. Director approval'),'Unexpected enclosing panel');assert.equal((oldPanel.match(/<section/g)||[]).length,1,'Nested approval panel needs manual review');
source=source.slice(0,panelStart)+`<section className="lsim-panel">
            <h4>Awaiting Director approval</h4>
            <p>{money(chosen.amount_cents)} — {chosen.reason}</p>
            <p>Approval is completed in Director Approval → Customer credits. No payment or stock release has occurred.</p>
            <div className="lsim-actions">
              <button type="button" className="lsim-pbtn" onClick={() => { setCreditConfirmed(false); setChosenCredit(null); setApprovalCreditsOpen(false); setSettleNotice(""); setActive("Director Approval"); }}>Open Director Approval — Customer credits</button>
              <button type="button" className="lsim-sbtn" onClick={() => creditAction("cancel", rc)}>Cancel credit draft</button>
            </div>
          </section>`+source.slice(panelEnd);
replaceOnce('  function creditAction(kind: "post" | "cancel", rc: Receipt) {','  function creditAction(kind: "post" | "cancel", rc: Receipt) {\n    if (kind === "post" && (active !== "Director Approval" || !approvalCreditsOpen)) { setSettleNotice("Open Director Approval → Customer credits to approve this credit."); return; }');
replaceOnce('    if (!credit) { setSettleNotice("Choose a saved credit draft."); return; }','    if (!credit) { setSettleNotice("Choose a saved credit draft."); return; }\n    if (credit.receipt_id !== rc.id || credit.status !== "draft") { setSettleNotice("Choose the matching saved credit draft."); return; }');
replaceOnce('    attempt({ type: "credit-post", credit }, () => {','    attempt({ type: "credit-post", credit }, () => {\n      setActive("Customer Returns"); setApprovalCreditsOpen(false); setCreditConfirmed(false);');
const central=`  function renderCreditApprovals() {
    const selected = credits.find(c => c.id === chosenCredit && c.status === "draft");
    const receipt = selected ? receipts.find(r => r.id === selected.receipt_id) : undefined;
    const invoice = selected ? seedInvoices.find(i => i.id === selected.invoice_id) : undefined;
    return <section className="lsim-panel">
      <h2>Director Approval</h2>
      <div className="lsim-actions">
        <button type="button" className="lsim-pbtn" aria-pressed={approvalCreditsOpen} onClick={() => { setApprovalCreditsOpen(true); setChosenCredit(null); setCreditConfirmed(false); }}>Customer credits</button>
        <button type="button" className="lsim-sbtn" onClick={() => { setCreditConfirmed(false); setActive("Customer Returns"); }}>Return to Customer Returns</button>
      </div>
      {approvalCreditsOpen && <>
        <h3>Customer credits</h3>
        <p>Review and approve a saved refund credit. Approval creates a refund payable; it does not move money or release stock.</p>
        <div className="lsim-actions">{credits.filter(c => c.status === "draft").map(c => <section className="lsim-panel" key={c.id}>
          <p>{seedInvoices.find(i => i.id === c.invoice_id)?.customer} — RCN-{String(c.number).padStart(5, "0")} — {c.date} — {money(c.amount_cents)}</p>
          <button type="button" className="lsim-sbtn" onClick={() => { setChosenCredit(c.id); setCreditConfirmed(false); setSettleNotice(""); }}>Review customer credit</button>
        </section>)}</div>
        {!credits.some(c => c.status === "draft") && <p>No pending refund credits.</p>}
        {selected && receipt && invoice && <section className="lsim-panel">
          <h4>Review customer credit — RCN-{String(selected.number).padStart(5, "0")}</h4>
          <p>{invoice.customer} — {soNumber(invoice.so)} — {invNumber(invoice.number)}</p>
          <p>Returned lot: {receipt.lot}. Quantity: {receipt.quantity}. Latest inspection: {receipt.inspections.length ? disposition(receipt.inspections[receipt.inspections.length - 1].decision) : "Awaiting inspection"}.</p>
          <p>{money(selected.amount_cents)} — {selected.reason}</p>
          <p>Dr 4100 Sales returns / Cr 2300 Customer refunds payable. The paid invoice, stock and bank balance do not change.</p>
          <label className="lsim-check"><input type="checkbox" checked={creditConfirmed} onChange={e => setCreditConfirmed(e.target.checked)} /> I approve this return credit and the amount EMS owes the customer.</label>
          <button type="button" className="lsim-pbtn" disabled={!creditConfirmed} onClick={() => creditAction("post", receipt)}>Approve and post customer credit</button>
        </section>}
        {settleNotice && <p role="status">{settleNotice}</p>}
      </>}
    </section>;
  }

`;
replaceOnce('  function renderContent() {',central+'  function renderContent() {\n    if (active === "Director Approval") return renderCreditApprovals();');
assert.equal(source.includes('>Approve refund credit</button>'),false);
assert.equal(source.includes('then approve it under “2. Director approval”'),false);
assert.ok(source.includes('active !== "Director Approval"'));
assert.ok(source.includes('disabled={!creditConfirmed} onClick={() => creditAction("post", receipt)}'));
writeFileSync(path,source);
console.log('Applied guarded Lesson 7 central approval correction; interactive validation remains required.');
