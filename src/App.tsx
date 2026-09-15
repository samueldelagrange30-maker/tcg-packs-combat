import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CollectionProvider } from './hooks/useCollection';
import { Catalogue } from './pages/Catalogue';
import { Collection } from './pages/Collection';
import { Combat } from './pages/Combat';
import { Home } from './pages/Home';
import { Packs } from './pages/Packs';

export default function App() {
  return (
    <CollectionProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="packs" element={<Packs />} />
            <Route path="catalogue" element={<Catalogue />} />
            <Route path="collection" element={<Collection />} />
            <Route path="combat" element={<Combat />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </CollectionProvider>
  );
}
