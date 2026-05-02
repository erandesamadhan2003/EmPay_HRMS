const C={teal:'#14B8A6',muted:'#8B8A9B',surface:'#13131A',border:'#2E2E3E',text:'#F1F0FF',danger:'#EF4444'};

export const LoadingSpinner=({message='Loading...'})=>(
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:60,fontFamily:'Poppins,sans-serif'}}>
    <style dangerouslySetInnerHTML={{__html:`@keyframes hkSpin{to{transform:rotate(360deg)}}`}}/>
    <div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTopColor:C.teal,borderRadius:'50%',animation:'hkSpin .7s linear infinite',marginBottom:14}}/>
    <span style={{fontSize:13,color:C.muted}}>{message}</span>
  </div>
);

export const ErrorState=({message='Something went wrong',onRetry})=>(
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:60,fontFamily:'Poppins,sans-serif'}}>
    <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(239,68,68,.12)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14}}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
    </div>
    <span style={{fontSize:14,color:C.text,fontWeight:500,marginBottom:4}}>{message}</span>
    {onRetry&&<button onClick={onRetry} style={{marginTop:10,background:C.teal,color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>Retry</button>}
  </div>
);
