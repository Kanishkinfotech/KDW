import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, replacements) {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
        console.error('File not found:', fullPath);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const { search, replace } of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(fullPath, content);
    console.log('Updated', fullPath);
}

replaceInFile('src/components/CartDrawer.tsx', [
    { search: "import { Link, useNavigate } from 'react-router-dom';", replace: "import { useNavigate } from 'react-router-dom';" }
]);

replaceInFile('src/components/CheckoutModal.tsx', [
    { search: "import { useState, useEffect } from 'react';", replace: "import { useState } from 'react';" }
]);

replaceInFile('src/components/layout/header/Header.tsx', [
    { search: "const { cart, wishlist, setCartOpen, setWishlistOpen } = useStore();", replace: "const { cart, wishlist } = useStore();" }
]);

replaceInFile('src/components/layout/header/MobileMenu.tsx', [
    { search: "const { cart, wishlist, setCartOpen, setWishlistOpen } = useStore();", replace: "const { cart, wishlist } = useStore();" }
]);

replaceInFile('src/components/layout/header/Navigation.tsx', [
    { search: "const timeoutRef = useRef<NodeJS.Timeout | null>(null);", replace: "const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);" }
]);

replaceInFile('src/components/WishlistDrawer.tsx', [
    { search: "const { wishlist, isWishlistOpen, setWishlistOpen, removeFromWishlist, clearWishlist, setCartOpen } = useStore();", replace: "const { wishlist, isWishlistOpen, setWishlistOpen, removeFromWishlist, clearWishlist } = useStore();" },
    { search: "const { wishlist, isWishlistOpen, setWishlistOpen, removeFromWishlist, clearWishlist, cart, setCartOpen } = useStore();", replace: "const { wishlist, isWishlistOpen, setWishlistOpen, removeFromWishlist, clearWishlist, cart } = useStore();" },
    { search: "const { wishlist, isWishlistOpen, setWishlistOpen, removeFromWishlist, clearWishlist, cart, addCart, setCartOpen } = useStore();", replace: "const { wishlist, isWishlistOpen, setWishlistOpen, removeFromWishlist, clearWishlist } = useStore();" },
    // I don't know the exact line for WishlistDrawer, so let's do a regex
    { search: /,\s*setCartOpen/g, replace: "" }
]);

replaceInFile('src/main.tsx', [
    { search: "const handleUncaughtError = (error: Error, errorInfo: React.ErrorInfo) => {", replace: "const handleUncaughtError = (_error: Error, _errorInfo: React.ErrorInfo) => {" },
    { search: "const handleCaughtError = (error: Error, errorInfo: React.ErrorInfo) => {", replace: "const handleCaughtError = (_error: Error, _errorInfo: React.ErrorInfo) => {" },
    { search: /error: Error/g, replace: "_error: Error" },
    { search: /errorInfo: React.ErrorInfo/g, replace: "_errorInfo: React.ErrorInfo" }
]);

replaceInFile('src/pages/admin/AdminCustomers.tsx', [
    { search: "import { Search, Filter, MoreVertical, Mail, MapPin, Calendar, Star, ChevronLeft, ChevronRight, User } from 'lucide-react';", replace: "import { Search, Filter, Mail, MapPin, Calendar, Star, ChevronLeft, ChevronRight, User } from 'lucide-react';" },
    { search: "const [users, setUsers] = useState<User[]>([", replace: "const [users] = useState<User[]>([" }
]);

replaceInFile('src/pages/admin/AdminDynamicView.tsx', [
    { search: "import { useParams, Navigate } from 'react-router-dom';", replace: "import { useParams } from 'react-router-dom';" }
]);

replaceInFile('src/pages/admin/AdminOrders.tsx', [
    { search: "const [orders, setOrders] = useState([", replace: "const [orders] = useState([" }
]);

replaceInFile('src/pages/admin/AdminProductForm.tsx', [
    { search: "import { ArrowLeft, Save, Image as ImageIcon, Plus, Trash2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';", replace: "import { ArrowLeft, Save, Image as ImageIcon, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';" }
]);

replaceInFile('src/pages/admin/AdminProducts.tsx', [
    { search: "import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, ArrowUpDown, Tag, Star } from 'lucide-react';", replace: "import { Plus, Search, Filter, Edit, Trash2, Eye, ArrowUpDown, Tag, Star } from 'lucide-react';" }
]);

replaceInFile('src/pages/Bundles.tsx', [
    { search: "import { Layers, Sparkles, Zap, ArrowRight, Download, Check, Star } from 'lucide-react';", replace: "import { Layers, Sparkles, Zap, ArrowRight, Star } from 'lucide-react';" },
    { search: "import { Link, useNavigate } from 'react-router-dom';", replace: "import { useNavigate } from 'react-router-dom';" }
]);

replaceInFile('src/pages/ProductDetails.tsx', [
    { search: "import { ShoppingCart, Heart, Star, Check, Shield, Zap, Layers, ArrowRight, CheckCircle2, Search, Share2, ZoomIn } from 'lucide-react';", replace: "import { ShoppingCart, Heart, Star, Check, Shield, Zap, Layers, ArrowRight, CheckCircle2, Search, ZoomIn } from 'lucide-react';" },
    { search: "(feature, idx)", replace: "(feature: string, idx: number)" },
    { search: "(file, idx)", replace: "(file: { name: string; size: string; type: string; }, idx: number)" },
    { search: "(file: any, idx: any)", replace: "(file: { name: string; size: string; type: string; }, idx: number)" }
]);

replaceInFile('src/store/useStore.ts', [
    { search: "const useStore = create<StoreState>()(persist((set, get) => ({", replace: "const useStore = create<StoreState>()(persist((set) => ({" }
]);

