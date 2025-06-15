// import React from 'react';
// import GoogleAuth from './GoogleAuth.jsx';
// import FacebookAuth from './FacebookAuth.jsx';

// const AuthContainer = () => {

//     return (
//         <div className="flex items-center justify-center">
//             <div className="rounded-2xl space-y-1 w-full max-w-md mx-1">
//                 <div className="flex flex-col gap-2 ">
//                     <div className=" w-full">
//                         <GoogleAuth />
//                     </div>
//                     {/* <div className="w-full">
//                         <FacebookAuth />
//                     </div> */}
//                 </div>
               
//             </div>
              
//         </div>
//     );
// };

// export default AuthContainer;
import GoogleAuth from './GoogleAuth';

const AuthContainer = ({ isModal = false }) => {
  return (
    <div className="w-full">
      <GoogleAuth isModal={isModal} />
    </div>
  );
};

export default AuthContainer;