import { Route, Routes } from 'react-router-dom'
import { Error500 } from './components/Error500'
import { Error404 } from './components/Error404'
import { ErrorsLayout } from './ErrorsLayout'
import { Error403 } from './components/Error403' // ⬅️ novo

const ErrorsPage = () => (
  <Routes>
    <Route element={<ErrorsLayout />}>
      <Route path='403' element={<Error403 />} />   {/* ⬅️ novo */}
      <Route path='404' element={<Error404 />} />
      <Route path='500' element={<Error500 />} />
      <Route index element={<Error404 />} />
    </Route>
  </Routes>
)

export { ErrorsPage }