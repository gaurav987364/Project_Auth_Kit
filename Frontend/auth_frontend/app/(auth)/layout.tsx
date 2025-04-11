import React from 'react'

const AuthLayout = ({children}:{children:React.ReactNode}) => {
  return (
    <div suppressHydrationWarning={true}>
        {children}
    </div>
  )
}

export default AuthLayout;