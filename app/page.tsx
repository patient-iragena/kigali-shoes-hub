"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import emailjs from "@emailjs/browser";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Search,
  ShoppingBag,
  Heart,
  Plus,
  X,
  CreditCard,
  CheckCircle2,
  Globe,
  MapPin,
  PhoneCall,
  FileText,
  User,
  Trash2,
  ShieldCheck,
  Menu,
  ArrowRight,
  Truck,
  RefreshCw,
  AlertCircle,
  Headphones,
  Minus,
  ShoppingBasket,
  LogOut,
  Smartphone,
} from "lucide-react";

// Social Media Custom SVG Icons
const FacebookIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-1.42V8.9a6.34 6.34 0 0 0-3.38.97 6.34 6.34 0 1 0 9.72 5.43V8.8a8.21 8.21 0 0 0 4.77 1.52V6.86a4.85 4.85 0 0 1-1.00-.17z" />
  </svg>
);

// InTouch Pay Custom Logo Component
const InTouchLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface Shoe {
  id: string;
  name: string;
  brand: string;
  price_rwf: number;
  category: string;
  description: string;
  image_url: string;
  is_featured: boolean;
  is_in_stock?: boolean;
  status?: string;
  available_sizes?: string[];
}

interface CartItem extends Shoe {
  selectedSize: string;
  quantity: number;
}

const AVAILABLE_SIZES = Array.from({ length: 41 }, (_, i) => String(20 + i));

export default function Storefront() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeView, setActiveView] = useState<
    "home" | "products" | "contact" | "how-to-buy" | "about" | "returns"
  >("home");
  const [wishlist, setWishlist] = useState<Shoe[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for Product Image Quick View Modal
  const [previewShoe, setPreviewShoe] = useState<Shoe | null>(null);

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;
  const [hasMore, setHasMore] = useState(true);

  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [locationType, setLocationType] = useState<"rwanda" | "abroad">("rwanda");
  const [shoeSize, setShoeSize] = useState("41");
  const [province, setProvince] = useState("Kigali City");
  const [district, setDistrict] = useState("Gasabo");
  const [localAddress, setLocalAddress] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<"mtn" | "airtel" | "intouch">("intouch");
  const [country, setCountry] = useState("");
  const [abroadAddress, setAbroadAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"form" | "processing" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderReference, setOrderReference] = useState("");

  const HELPLINE_NUMBER = "+250781827386";
  const DISPLAY_HELPLINE = "0781827386";
  const OWNER_EMAIL = "patientira79@gmail.com";

  // Social Media Handles
  const SOCIAL_HANDLES = {
    facebook: "https://facebook.com/kigali.shoes.hub",
    instagram: "https://instagram.com/kigali.shoes.hub",
    tiktok: "https://tiktok.com/@kigali.shoes.hub",
  };

  const rwandaDistricts: Record<string, string[]> = {
    "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
    "Eastern Province": [
      "Bugesera",
      "Gatsibo",
      "Kayonza",
      "Kirehe",
      "Ngoma",
      "Nyagatare",
      "Rwamagana",
    ],
    "Western Province": [
      "Karongi",
      "Nyabihu",
      "Rubavu",
      "Rusizi",
      "Rutsiro",
      "Nyamasheke",
      "Ngororero",
    ],
    "Northern Province": ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
    "Southern Province": [
      "Gisagara",
      "Huye",
      "Kamonyi",
      "Muhanga",
      "Nyamagabe",
      "Nyanza",
      "Nyaruguru",
      "Rruhango",
    ],
  };

  // --------------------------------------------------
  // AUTHENTICATION & USER PERSISTENCE SETUP
  // --------------------------------------------------
  useEffect(() => {
    setIsHydrated(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        setCustomerEmail(user.email || "");
        syncUserData(user.id);
      } else {
        loadFromLocalStorage();
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        setCurrentUser(user);
        if (user) {
          setCustomerEmail(user.email || "");
          syncUserData(user.id);
        } else {
          loadFromLocalStorage();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const savedCart = localStorage.getItem("ksh_cart");
      const savedWishlist = localStorage.getItem("ksh_wishlist");
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (e) {
      console.error("Failed loading local data", e);
    }
  };

  const syncUserData = async (userId: string) => {
    try {
      const { data: dbWishlist } = await supabase
        .from("wishlist_items")
        .select("shoe_id, shoes(*)")
        .eq("user_id", userId);

      if (dbWishlist) {
        const fetchedWishlist: Shoe[] = dbWishlist
          .map((item: any) => item.shoes)
          .filter(Boolean);
        setWishlist(fetchedWishlist);
      }

      const { data: dbCart } = await supabase
        .from("cart_items")
        .select("shoe_id, selected_size, quantity, shoes(*)")
        .eq("user_id", userId);

      if (dbCart) {
        const fetchedCart: CartItem[] = dbCart
          .map((item: any) =>
            item.shoes
              ? {
                  ...item.shoes,
                  selectedSize: item.selected_size,
                  quantity: item.quantity,
                }
              : null
          )
          .filter(Boolean);
        setCart(fetchedCart);
      }
    } catch (err) {
      console.error("Error syncing database user cart/wishlist:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchShoes(true);
  }, [debouncedSearch, selectedCategory]);

  async function fetchShoes(isInitial = true) {
    setLoading(true);
    const currentPage = isInitial ? 0 : page;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("shoes").select("*", { count: "exact" });

    if (debouncedSearch.trim()) {
      query = query.or(
        `name.ilike.%${debouncedSearch.trim()}%,brand.ilike.%${debouncedSearch.trim()}%`
      );
    }

    if (selectedCategory === "Popular") {
      query = query.eq("is_featured", true).order("created_at", { ascending: false });
    } else if (selectedCategory === "Lowest price") {
      query = query.lte("price_rwf", 25000).order("price_rwf", { ascending: true });
    } else if (selectedCategory === "New Releases") {
      query = query.order("created_at", { ascending: false });
    } else if (selectedCategory === "Deals") {
      query = query.or(`is_featured.eq.true,status.eq.LIMITED STOCK`).order("price_rwf", { ascending: true });
    } else if (selectedCategory !== "All") {
      query = query.eq("category", selectedCategory).order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error("Error fetching footwear from Supabase:", error.message);
    } else {
      if (isInitial) {
        setShoes(data || []);
        setPage(1);
      } else {
        setShoes((prev) => [...prev, ...(data || [])]);
        setPage((prev) => prev + 1);
      }

      if (data && from + data.length >= (count || 0)) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }
    setLoading(false);
  }

  const toggleWishlist = async (shoe: Shoe) => {
    const isWishlisted = wishlist.some((item) => item.id === shoe.id);
    const updatedWishlist = isWishlisted
      ? wishlist.filter((item) => item.id !== shoe.id)
      : [...wishlist, shoe];

    setWishlist(updatedWishlist);

    if (currentUser) {
      if (isWishlisted) {
        await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("shoe_id", shoe.id);
      } else {
        await supabase.from("wishlist_items").insert({
          user_id: currentUser.id,
          shoe_id: shoe.id,
        });
      }
    } else {
      localStorage.setItem("ksh_wishlist", JSON.stringify(updatedWishlist));
    }
  };

  const addToCart = async (shoe: Shoe, size = shoeSize) => {
    const defaultSize =
      shoe.available_sizes && shoe.available_sizes.length > 0
        ? shoe.available_sizes[0]
        : size;

    let updatedCart: CartItem[] = [];
    const existingIndex = cart.findIndex(
      (item) => item.id === shoe.id && item.selectedSize === defaultSize
    );

    if (existingIndex > -1) {
      updatedCart = cart.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...cart, { ...shoe, selectedSize: defaultSize, quantity: 1 }];
    }

    setCart(updatedCart);

    if (currentUser) {
      const newQty = existingIndex > -1 ? cart[existingIndex].quantity + 1 : 1;
      await supabase.from("cart_items").upsert(
        {
          user_id: currentUser.id,
          shoe_id: shoe.id,
          selected_size: defaultSize,
          quantity: newQty,
        },
        { onConflict: "user_id, shoe_id, selected_size" }
      );
    } else {
      localStorage.setItem("ksh_cart", JSON.stringify(updatedCart));
    }
  };

  const updateQuantity = async (id: string, size: string, delta: number) => {
    const itemToUpdate = cart.find(
      (item) => item.id === id && item.selectedSize === size
    );
    if (!itemToUpdate) return;

    const newQty = itemToUpdate.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(id, size);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.id === id && item.selectedSize === size
        ? { ...item, quantity: newQty }
        : item
    );
    setCart(updatedCart);

    if (currentUser) {
      await supabase
        .from("cart_items")
        .update({ quantity: newQty })
        .eq("user_id", currentUser.id)
        .eq("shoe_id", id)
        .eq("selected_size", size);
    } else {
      localStorage.setItem("ksh_cart", JSON.stringify(updatedCart));
    }
  };

  const removeFromCart = async (id: string, size: string) => {
    const updatedCart = cart.filter(
      (item) => !(item.id === id && item.selectedSize === size)
    );
    setCart(updatedCart);

    if (currentUser) {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("shoe_id", id)
        .eq("selected_size", size);
    } else {
      localStorage.setItem("ksh_cart", JSON.stringify(updatedCart));
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (currentUser) {
      await supabase.from("cart_items").delete().eq("user_id", currentUser.id);
    } else {
      localStorage.removeItem("ksh_cart");
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price_rwf * item.quantity,
    0
  );

  const openSingleItemCheckout = (shoe: Shoe) => {
    const initialSize =
      shoe.available_sizes && shoe.available_sizes.length > 0
        ? shoe.available_sizes[0]
        : shoeSize;
    setCheckoutItems([
      {
        ...shoe,
        selectedSize: initialSize,
        quantity: 1,
      },
    ]);
    setIsCheckoutOpen(true);
  };

  const openCartCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutItems(cart);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const itemsBasePrice = checkoutItems.reduce(
    (sum, item) => sum + item.price_rwf * item.quantity,
    0
  );

  const calculateDeliveryFee = () => {
    if (locationType === "abroad") {
      return 0;
    }
    return province === "Kigali City" ? 0 : 3000;
  };

  const deliveryFee = calculateDeliveryFee();
  const finalTotalPrice = itemsBasePrice + deliveryFee;

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error("Google Authentication Error:", error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setWishlist([]);
    setCart([]);
    localStorage.removeItem("ksh_cart");
    localStorage.removeItem("ksh_wishlist");
    setIsAuthModalOpen(false);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage("");

    if (locationType === "rwanda") {
      const cleanedPhone = customerPhone.trim();
      const rwandaPhoneRegex = /^(78|79|72|73)\d{7}$/;
      if (!rwandaPhoneRegex.test(cleanedPhone)) {
        setErrorMessage(
          "Please enter a valid 9-digit Rwanda phone number starting with 78, 79, 72, or 73."
        );
        return;
      }
    }

    setIsSubmitting(true);
    setPaymentStatus("processing");

    const fullPhoneNumber =
      locationType === "rwanda" ? `250${customerPhone.trim()}` : customerPhone.trim();
    const locationDetails =
      locationType === "rwanda"
        ? `${province}, ${district} - ${localAddress}`
        : `${abroadAddress}, ${country}`;
    const paymentMethodText =
      locationType === "rwanda"
        ? paymentProvider === "intouch"
          ? "INTOUCH PAY (MTN/Airtel)"
          : paymentProvider.toUpperCase()
        : "International Order - Payment Pending";

    // Save order to Supabase
    const { data: savedOrders, error: ordersError } = await supabase
      .from("orders")
      .insert(
        checkoutItems.map((item) => ({
          shoe_id: item.id,
          size: String(item.selectedSize),
          customer_phone: `+${fullPhoneNumber}`,
          amount_rwf: item.price_rwf * item.quantity,
          user_id: currentUser ? currentUser.id : null,
          payment_method: paymentProvider,
          payment_status: "PENDING",
        }))
      )
      .select("id");

    if (ordersError || !savedOrders) {
      console.error("Error saving order to Supabase:", ordersError?.message || ordersError);
      setErrorMessage(
        ordersError?.message || "We couldn't save your order. Please check your connection and try again."
      );
      setPaymentStatus("error");
      setIsSubmitting(false);
      return;
    }

    const orderIds = savedOrders.map((o) => o.id);
    const reference = orderIds[0] ? orderIds[0].slice(0, 8).toUpperCase() : "";
    setOrderReference(reference);

    // Call InTouch Rwanda Payment API endpoint if selected inside Rwanda
    if (locationType === "rwanda" && (paymentProvider === "intouch" || paymentProvider === "mtn" || paymentProvider === "airtel")) {
      try {
        const intouchRes = await fetch("/api/intouch/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalTotalPrice,
            phone: fullPhoneNumber,
            orderRef: reference,
            email: customerEmail,
          }),
        });

        const intouchData = await intouchRes.json();

        if (!intouchRes.ok || !intouchData.success) {
          console.warn("InTouch direct API notice:", intouchData.message || "Push sent");
        }
      } catch (err) {
        console.error("InTouch API processing warning:", err);
      }
    }

    const itemsSummary = checkoutItems
      .map(
        (item) =>
          `${item.name} (EU ${item.selectedSize}) x${item.quantity} - RWF ${(
            item.price_rwf * item.quantity
          ).toLocaleString()}`
      )
      .join("\n");

    const basePayload = {
      title: `Footwear Order (${checkoutItems.length} items)`,
      name: customerEmail ? customerEmail.split("@")[0] : "Customer",
      message: `Order Details:\n${itemsSummary}`,
      order_reference: reference,
      shoe_name:
        checkoutItems.length === 1
          ? checkoutItems[0].name
          : `${checkoutItems.length} Footwear Items`,
      shoe_size:
        checkoutItems.length === 1
          ? checkoutItems[0].selectedSize
          : "Multiple Sizes",
      shoe_price: `RWF ${itemsBasePrice.toLocaleString()}`,
      delivery_fee: `RWF ${deliveryFee.toLocaleString()}`,
      total_price: `RWF ${finalTotalPrice.toLocaleString()}`,
      customer_phone: String(`+${fullPhoneNumber}`),
      customer_email: String(customerEmail),
      to_email: String(customerEmail),
      location_details: String(locationDetails),
      payment_type: String(paymentMethodText),
    };

    // Safely execute email dispatches with Promise.allSettled
    await Promise.allSettled([
      emailjs.send(
        "service_84glr5p",
        "template_wu0bkeb",
        { ...basePayload, to_email: OWNER_EMAIL },
        "83vF3uD9oYthKT_vR"
      ),
      emailjs.send(
        "service_84glr5p",
        "template_oschd8a",
        { ...basePayload, to_email: customerEmail },
        "83vF3uD9oYthKT_vR"
      ),
    ]);

    setPaymentStatus("success");
    setIsSubmitting(false);
    clearCart();
  };

  const closeModal = () => {
    setIsCheckoutOpen(false);
    setCheckoutItems([]);
    setPaymentStatus("form");
    setErrorMessage("");
    setIsSubmitting(false);
    setCustomerPhone("");
    setLocalAddress("");
    setAbroadAddress("");
    setCountry("");
    setOrderReference("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-black selection:text-white">
      <div>
        {/* Top Announcement Bar */}
        <div className="bg-black text-white text-[11px] font-medium py-2.5 px-4 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-white" />
              <span className="tracking-wide">
                HELP LINE : <strong className="font-bold text-white">{DISPLAY_HELPLINE}</strong>
              </span>
            </div>
            <div className="flex items-center gap-6 text-slate-300">
              <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                <Truck className="w-3.5 h-3.5" /> Express Delivery Across Rwanda
              </span>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="hover:text-white font-semibold flex items-center gap-1.5 transition"
              >
                <User className="w-3.5 h-3.5 text-white" />
                <span>
                  {isHydrated && currentUser
                    ? currentUser.email?.split("@")[0]
                    : "Customer Account"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            <div
              onClick={() => setActiveView("home")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Image
                src="/logo.png"
                alt="Kigali Shoes Hub Logo"
                width={40}
                height={40}
                priority
                className="w-10 h-10 object-contain group-hover:scale-105 transition duration-200 shrink-0"
              />
              <div>
                <h1 className="font-extrabold text-lg leading-tight text-slate-900 group-hover:text-black transition">
                  Kigali Shoes Hub
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  Official Footwear Store
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 font-semibold text-xs text-slate-700">
              {(["home", "products", "how-to-buy", "about", "contact", "returns"] as const).map(
                (view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`transition capitalize ${
                      activeView === view
                        ? "text-black font-extrabold border-b-2 border-black pb-1"
                        : "hover:text-black"
                    }`}
                  >
                    {view.replace("-", " ")}
                  </button>
                )
              )}
            </nav>

            {/* Desktop Search Input */}
            <div className="hidden md:flex flex-1 max-w-xs relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeView !== "home" && activeView !== "products") {
                    setActiveView("products");
                  }
                }}
                placeholder="Search sneakers, boots, sizes..."
                className="w-full bg-slate-100 border-none rounded-full pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-black focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="p-2 text-slate-700 hover:text-black hover:bg-slate-100 rounded-full transition relative"
                title="Saved Wishlist"
              >
                <Heart className="w-5 h-5" />
                {isHydrated && wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-slate-700 hover:text-black hover:bg-slate-100 rounded-full transition relative"
                title="Shopping Bag"
              >
                <ShoppingBag className="w-5 h-5" />
                {isHydrated && cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="p-2 text-slate-700 hover:text-black hover:bg-slate-100 rounded-full transition"
                title="Account Login"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-700 lg:hidden hover:bg-slate-100 rounded-full"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 text-xs font-semibold text-slate-800 shadow-lg">
              {(["home", "products", "how-to-buy", "about", "contact", "returns"] as const).map(
                (view) => (
                  <button
                    key={view}
                    onClick={() => {
                      setActiveView(view);
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-1.5 hover:text-black capitalize"
                  >
                    {view.replace("-", " ")}
                  </button>
                )
              )}
            </div>
          )}
        </header>

        {/* MOBILE SEARCH BAR */}
        <div className="md:hidden bg-white px-4 py-3 border-b border-slate-200 shadow-xs sticky top-[80px] z-30">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeView !== "home" && activeView !== "products") {
                  setActiveView("products");
                }
              }}
              placeholder="Search products..."
              className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-8 py-2.5 text-xs font-medium focus:ring-2 focus:ring-black focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Store View Display */}
        {(activeView === "home" || activeView === "products") && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200/60 mb-6 overflow-x-auto gap-2 scrollbar-none">
              <div className="flex items-center gap-2">
                {[
                  "All",
                  "Popular",
                  "Sneakers",
                  "Formal",
                  "Boots",
                  "Deals",
                  "Lowest price",
                  "New Releases",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? "bg-black text-white shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block whitespace-nowrap">
                Showing top footwear across Rwanda
              </p>
            </div>

            <div className="mb-10 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4 text-center sm:text-left">
                Why Shop With Us?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Truck className="w-6 h-6 text-black shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Fast Rwanda Delivery
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Same day in Kigali & 24–48h provinces
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CreditCard className="w-6 h-6 text-black shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      InTouch Mobile Payments
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Instant MTN MoMo & Airtel Money
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <RefreshCw className="w-6 h-6 text-black shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Easy Returns</h4>
                    <p className="text-[10px] text-slate-500">
                      Hassle free size exchanges
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Headphones className="w-6 h-6 text-black shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Customer Support
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Call us anytime on {DISPLAY_HELPLINE}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {debouncedSearch
                  ? `Search Results for "${debouncedSearch}"`
                  : "TOP PICKS SHOPPERS GRAB FROM KIGALI SHOES HUB"}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {shoes.length} Footwear Available
              </span>
            </div>

            {loading && shoes.length === 0 ? (
              <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Searching footwear database...</span>
              </div>
            ) : shoes.length === 0 ? (
              <div className="py-24 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                No footwear found matching your filter criteria.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {shoes.map((shoe) => {
                    const isWishlisted = wishlist.some((item) => item.id === shoe.id);
                    const isInStock = shoe.status
                      ? shoe.status !== "OUT OF STOCK"
                      : shoe.is_in_stock !== false;
                    return (
                      <div
                        key={shoe.id}
                        className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between group relative"
                      >
                        <div>
                          <div
                            onClick={() => setPreviewShoe(shoe)}
                            className="relative mb-3 overflow-hidden rounded-xl bg-slate-100 cursor-pointer group-hover:opacity-95 transition"
                            title="Click to view details"
                          >
                            <img
                              src={shoe.image_url}
                              alt={shoe.name}
                              className="w-full h-36 sm:h-52 object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute top-2 left-2">
                              <span
                                className={`text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs shadow-xs text-white ${
                                  shoe.status === "OUT OF STOCK"
                                    ? "bg-rose-500/90"
                                    : shoe.status === "LIMITED STOCK"
                                    ? "bg-amber-500/90"
                                    : "bg-emerald-500/90"
                                }`}
                              >
                                {shoe.status || (isInStock ? "In Stock" : "Out of Stock")}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(shoe);
                              }}
                              className={`absolute top-2 right-2 p-1.5 backdrop-blur-md rounded-full transition ${
                                isWishlisted
                                  ? "bg-red-500 text-white"
                                  : "bg-white/80 text-slate-700 hover:text-red-500"
                              }`}
                            >
                              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                            </button>
                          </div>
                          <h3
                            onClick={() => setPreviewShoe(shoe)}
                            className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-black transition line-clamp-1 cursor-pointer"
                          >
                            {shoe.name}
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                            {shoe.category || "Footwear"} • {shoe.brand || "KSH"}
                          </p>
                          {shoe.available_sizes && shoe.available_sizes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1 items-center">
                              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 mr-0.5">
                                Sizes:
                              </span>
                              {shoe.available_sizes.slice(0, 4).map((sz) => (
                                <span
                                  key={sz}
                                  className="text-[8px] sm:text-[9px] font-bold bg-slate-100 text-slate-700 px-1 sm:px-1.5 py-0.5 rounded-md border border-slate-200"
                                >
                                  {sz}
                                </span>
                              ))}
                              {shoe.available_sizes.length > 4 && (
                                <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold">
                                  +{shoe.available_sizes.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                          <div>
                            <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">
                              Price
                            </p>
                            <p className="text-xs sm:text-sm font-extrabold text-black">
                              RWF {shoe.price_rwf?.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <button
                              onClick={() => addToCart(shoe)}
                              disabled={!isInStock}
                              className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold p-2 sm:p-2.5 rounded-xl text-xs transition"
                              title={isInStock ? "Add to Shopping Bag" : "Currently Out of Stock"}
                            >
                              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={() => openSingleItemCheckout(shoe)}
                              disabled={!isInStock}
                              className="bg-black hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold p-2 sm:p-2.5 rounded-xl transition shadow-md flex items-center justify-center"
                              title={isInStock ? "Buy Shoe Now" : "Currently Out of Stock"}
                            >
                              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {hasMore && (
                  <div className="mt-12 text-center">
                    <button
                      onClick={() => fetchShoes(false)}
                      disabled={loading}
                      className="bg-black hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold px-8 py-3 rounded-full text-xs transition shadow-md"
                    >
                      {loading ? "Loading More Footwear..." : "Load More Shoes"}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        )}

        {/* How To Buy Page */}
        {activeView === "how-to-buy" && (
          <main className="max-w-4xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              How To Buy at Kigali Shoes Hub
            </h2>
            <p className="text-xs text-slate-500 mb-8">
              Seamless 4-step process to order footwear delivered to your doorstep in Rwanda or internationally.
            </p>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 flex gap-4 items-start shadow-xs">
                <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Select Your Footwear & EU Size (20 - 60)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Browse through our catalog and click on the <b>+</b> button on any item to open the checkout modal or save it into your Shopping Bag.
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 flex gap-4 items-start shadow-xs">
                <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Choose Delivery Destination
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Select whether your delivery address is <b>Inside Rwanda</b> (Province & District selection) or <b>Outside Rwanda</b> (International Shipping address).
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 flex gap-4 items-start shadow-xs">
                <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Complete InTouch Payment Prompt
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Pay securely via <b>InTouch Pay (MTN MoMo or Airtel Money)</b> or <b>International Card</b>. Enter your active phone number to authorize the instant payment prompt.
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 flex gap-4 items-start shadow-xs">
                <div className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Receive Order Confirmation & Delivery
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    You will receive an automated email receipt. Same-day delivery inside Kigali, 24–48 hours across provinces.
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* About Us Page */}
        {activeView === "about" && (
          <main className="max-w-4xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-black text-slate-900 mb-2">About Kigali Shoes Hub</h2>
            <p className="text-xs text-slate-500 mb-8">
              Rwanda&apos;s premier store for original sneakers, official footwear, and athletic shoes.
            </p>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-700 leading-relaxed shadow-xs">
              <p>
                Founded in Kigali, Rwanda, <b>Kigali Shoes Hub (KSH)</b> is committed to delivering authentic footwear to sports enthusiasts, professionals, and daily wearers across East Africa.
              </p>
              <p>
                We offer an extensive selection of sizes ranging from <b>EU 20 to EU 60</b>, ensuring comfortable fits for children, adults, and oversized requirements.
              </p>
              <h3 className="font-bold text-sm text-slate-900 pt-4">Our Store Guarantees</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>100% Guaranteed Quality and Verified Footwear</li>
                <li>Comprehensive Size Range (EU 20 - 60)</li>
                <li>Fast Local & Provincial Delivery via Integrated InTouch Mobile Payments</li>
                <li>Clear and Fair Returns/Exchange Policy</li>
                <li>Dedicated Customer Care Line ({DISPLAY_HELPLINE})</li>
              </ul>
            </div>
          </main>
        )}

        {/* Contact Page */}
        {activeView === "contact" && (
          <main className="max-w-4xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Contact Support</h2>
            <p className="text-xs text-slate-500 mb-8">
              Have questions regarding sizing, custom orders, or delivery tracking? Get in touch.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <PhoneCall className="w-5 h-5 text-slate-900" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Direct Support Phone Line</h4>
                    <a href={`tel:${HELPLINE_NUMBER}`} className="text-xs text-slate-600 hover:underline">
                      {DISPLAY_HELPLINE} ({HELPLINE_NUMBER})
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-900" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Official Email Inquiry</h4>
                    <a href={`mailto:${OWNER_EMAIL}`} className="text-xs text-slate-600 hover:underline">
                      {OWNER_EMAIL}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-900" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Store Address</h4>
                    <p className="text-xs text-slate-600">Kigali City, Rwanda</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 mb-3">Customer Support Hours</h3>
                  <p className="text-xs text-slate-600 mb-2">
                    <b>Monday - Saturday:</b> 8:00 AM – 8:00 PM CAT
                  </p>
                  <p className="text-xs text-slate-600">
                    <b>Sunday:</b> 10:00 AM – 6:00 PM CAT
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h4 className="font-bold text-xs text-slate-900 mb-3">Follow & Message Us</h4>
                  <div className="flex items-center gap-3">
                    <a
                      href={SOCIAL_HANDLES.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-100 hover:bg-black hover:text-white rounded-xl transition text-slate-800 flex items-center justify-center"
                      title="Facebook: kigali.shoes.hub"
                    >
                      <FacebookIcon className="w-4 h-4" />
                    </a>
                    <a
                      href={SOCIAL_HANDLES.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-100 hover:bg-black hover:text-white rounded-xl transition text-slate-800 flex items-center justify-center"
                      title="Instagram: kigali.shoes.hub"
                    >
                      <InstagramIcon className="w-4 h-4" />
                    </a>
                    <a
                      href={SOCIAL_HANDLES.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-100 hover:bg-black hover:text-white rounded-xl transition text-slate-800 flex items-center justify-center"
                      title="TikTok: kigali.shoes.hub"
                    >
                      <TikTokIcon className="w-4 h-4" />
                    </a>
                    <span className="text-xs font-semibold text-slate-500">@kigali.shoes.hub</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Returns Policy Page */}
        {activeView === "returns" && (
          <main className="max-w-4xl mx-auto px-4 py-12">
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              Returns & Exchange Policy
            </h2>
            <p className="text-xs text-slate-500 mb-8">
              Guaranteed customer satisfaction with transparent size adjustments.
            </p>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-700 leading-relaxed shadow-xs">
              <h3 className="font-bold text-sm text-slate-900">1. Size Exchange Eligibility</h3>
              <p>
                If your shoe fit is incorrect, size exchange requests are accepted within <b>48 hours</b> of delivery inside Rwanda. Items must remain unworn, undamaged, and inside original packaging.
              </p>
              <h3 className="font-bold text-sm text-slate-900">2. Refund Processing</h3>
              <p>
                Approved refunds are processed back to the original Mobile Money account (MTN MoMo or Airtel Money via InTouch Pay) or International Card within <b>3–5 business days</b>.
              </p>
            </div>
          </main>
        )}
      </div>

      {/* PRODUCT IMAGE QUICK VIEW MODAL */}
      {previewShoe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPreviewShoe(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-black p-2 rounded-full bg-slate-100 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={previewShoe.image_url}
                  alt={previewShoe.name}
                  className="w-full h-64 sm:h-80 object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {previewShoe.brand || "Kigali Shoes Hub"}
                </span>
                <h2 className="font-black text-lg sm:text-xl text-slate-900 leading-tight mt-0.5">
                  {previewShoe.name}
                </h2>
                <p className="text-base font-extrabold text-black mt-1">
                  RWF {previewShoe.price_rwf?.toLocaleString()}
                </p>
              </div>
              {previewShoe.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {previewShoe.description}
                </p>
              )}
              {previewShoe.available_sizes && previewShoe.available_sizes.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                    Available Sizes
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {previewShoe.available_sizes.map((sz) => (
                      <span
                        key={sz}
                        className="text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200"
                      >
                        EU {sz}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    addToCart(previewShoe);
                    setPreviewShoe(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <ShoppingBag className="w-4 h-4" /> Add To Bag
                </button>
                <button
                  onClick={() => {
                    const item = previewShoe;
                    setPreviewShoe(null);
                    openSingleItemCheckout(item);
                  }}
                  className="flex-1 bg-black hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-xs transition shadow-md"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING BAG DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between transform transition duration-300 ease-in-out">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-2xl text-slate-900">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-slate-900">Shopping Bag</h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {cart.reduce((a, b) => a + b.quantity, 0)} item
                      {cart.reduce((a, b) => a + b.quantity, 0) !== 1 ? "s" : ""} in your bag
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300 border border-slate-100">
                      <ShoppingBasket className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">
                      Your Shopping Bag is empty
                    </h3>
                    <p className="text-xs text-slate-400 max-w-[220px] mb-6">
                      Looks like you haven&apos;t added any footwear to your bag yet.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="bg-black hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-sm"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={`${item.id}-${item.selectedSize}-${idx}`}
                      className="flex gap-4 p-3.5 border border-slate-100 rounded-2xl bg-white shadow-xs hover:border-slate-200 transition group"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-xl bg-slate-50 shrink-0 border border-slate-100"
                      />
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-xs text-slate-900 truncate">
                              {item.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.id, item.selectedSize)}
                              className="text-slate-300 hover:text-red-500 transition shrink-0 p-0.5"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            Size: EU {item.selectedSize}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                          <p className="text-xs font-black text-slate-900">
                            RWF {(item.price_rwf * item.quantity).toLocaleString()}
                          </p>
                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, -1)}
                              className="p-1 hover:bg-white text-slate-600 rounded-l-lg transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-[11px] font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, 1)}
                              className="p-1 hover:bg-white text-slate-600 rounded-r-lg transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-white space-y-4 shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-700">
                        RWF {cartTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Estimated Delivery</span>
                      <span className="font-semibold text-emerald-600">Calculated at checkout</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                      <span>Bag Total</span>
                      <span className="text-base text-black">
                        RWF {cartTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={openCartCheckout}
                    className="w-full bg-black hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition duration-200 active:scale-[0.99]"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Powered by InTouch Mobile Payments
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WISHLIST DRAWER */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-current" /> My Wishlist ({wishlist.length})
                </h3>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[70vh] pr-1">
                {wishlist.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">
                    No footwear saved to your wishlist yet.
                  </p>
                ) : (
                  wishlist.map((shoe) => (
                    <div
                      key={shoe.id}
                      className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50"
                    >
                      <img
                        src={shoe.image_url}
                        alt={shoe.name}
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                      <div className="flex-1 px-3">
                        <h4 className="font-bold text-xs text-slate-900">{shoe.name}</h4>
                        <p className="text-xs font-black text-black">
                          RWF {shoe.price_rwf?.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            addToCart(shoe);
                            toggleWishlist(shoe);
                          }}
                          className="bg-black text-white p-2 rounded-lg text-xs font-bold"
                          title="Move to Bag"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleWishlist(shoe)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT LOGIN & USER PROFILE MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>
            <Image
              src="/logo.png"
              alt="Kigali Shoes Hub Logo"
              width={48}
              height={48}
              priority
              className="w-12 h-12 mx-auto mb-4 object-contain"
            />
            {currentUser ? (
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-1">Welcome Back!</h3>
                <p className="text-xs text-slate-500 mb-6 font-medium">
                  Signed in as <br />
                  <strong className="text-slate-900 font-bold">{currentUser.email}</strong>
                </p>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 mb-6 leading-relaxed">
                  Your cart and wishlist are synced across all your devices.
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3.5 rounded-2xl text-xs transition"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 mb-1">
                  Customer Account Access
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Sign in to keep your bag and wishlist across devices and track orders.
                </p>
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 py-3.5 rounded-2xl text-xs font-bold text-slate-800 transition"
                >
                  <Globe className="w-4 h-4 text-blue-600" /> Continue with Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INTERACTIVE CHECKOUT MODAL WITH INTOUCH PAYMENT INTEGRATION */}
      {isCheckoutOpen && checkoutItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-black p-1"
            >
              <X className="w-5 h-5" />
            </button>
            {paymentStatus === "form" && (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div className="pb-4 border-b border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Order Summary ({checkoutItems.length} item
                    {checkoutItems.length > 1 ? "s" : ""})
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                    {checkoutItems.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        className="flex gap-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-100"
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-xl shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-xs text-slate-900 truncate">
                            {item.name}
                          </h3>
                          <p className="text-[10px] text-slate-500">
                            Size: EU {item.selectedSize} | Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-xs font-black text-black shrink-0">
                          RWF {(item.price_rwf * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {checkoutItems.length === 1 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Select Shoe Size
                    </label>
                    <div className="flex gap-1.5 overflow-x-auto py-1.5 scrollbar-thin">
                      {(checkoutItems[0].available_sizes &&
                      checkoutItems[0].available_sizes.length > 0
                        ? checkoutItems[0].available_sizes
                        : AVAILABLE_SIZES
                      ).map((sz) => (
                        <button
                          type="button"
                          key={sz}
                          onClick={() => {
                            setShoeSize(sz);
                            setCheckoutItems((prev) =>
                              prev.map((it) => ({ ...it, selectedSize: sz }))
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                            checkoutItems[0].selectedSize === sz
                              ? "bg-black text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Delivery Destination
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLocationType("rwanda")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        locationType === "rwanda"
                          ? "bg-black text-white border-black"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Inside Rwanda
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationType("abroad")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        locationType === "abroad"
                          ? "bg-black text-white border-black"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      Outside Rwanda
                    </button>
                  </div>
                </div>

                {locationType === "rwanda" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Province
                        </label>
                        <select
                          value={province}
                          onChange={(e) => {
                            setProvince(e.target.value);
                            setDistrict(rwandaDistricts[e.target.value][0]);
                          }}
                          className="w-full bg-slate-100 border-none rounded-xl text-xs p-2.5 font-medium focus:ring-2 focus:ring-black"
                        >
                          {Object.keys(rwandaDistricts).map((prov) => (
                            <option key={prov} value={prov}>
                              {prov}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          District
                        </label>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full bg-slate-100 border-none rounded-xl text-xs p-2.5 font-medium focus:ring-2 focus:ring-black"
                        >
                          {rwandaDistricts[province].map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Street / Sector / House Address
                      </label>
                      <input
                        type="text"
                        required
                        value={localAddress}
                        onChange={(e) => setLocalAddress(e.target.value)}
                        placeholder="e.g. KK 15 Ave, Kicukiro"
                        className="w-full bg-slate-100 border-none rounded-xl text-xs p-2.5 font-medium focus:ring-2 focus:ring-black"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Select Payment Gateway
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentProvider("intouch")}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold border flex items-center justify-center gap-1 transition ${
                            paymentProvider === "intouch"
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          <InTouchLogo className="w-3.5 h-3.5" />
                          <span>InTouch</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentProvider("mtn")}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold border transition ${
                            paymentProvider === "mtn"
                              ? "bg-yellow-400 text-black border-yellow-500 shadow-xs"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          MTN MoMo
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentProvider("airtel")}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold border transition ${
                            paymentProvider === "airtel"
                              ? "bg-red-600 text-white border-red-700 shadow-xs"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          Airtel
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Payment Mobile Phone Number
                      </label>
                      <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black">
                        <span className="px-3 text-xs font-bold text-slate-600 border-r border-slate-200 bg-slate-200/60 py-2.5">
                          +250
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={9}
                          value={customerPhone}
                          onChange={(e) =>
                            setCustomerPhone(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="788000000"
                          className="w-full bg-transparent border-none text-xs p-2.5 font-medium focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Must be 9 digits starting with 78, 79, 72, or 73.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. Kenya, Uganda, USA"
                        className="w-full bg-slate-100 border-none rounded-xl text-xs p-2.5 font-medium focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        International Shipping Address
                      </label>
                      <input
                        type="text"
                        required
                        value={abroadAddress}
                        onChange={(e) => setAbroadAddress(e.target.value)}
                        placeholder="Full delivery street address"
                        className="w-full bg-slate-100 border-none rounded-xl text-xs p-2.5 font-medium focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        Contact Phone Number (with country code)
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. +1 555 000 0000"
                        className="w-full bg-slate-100 border-none rounded-xl text-xs p-2.5 font-medium focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5 items-start">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        International orders are reserved without payment right now.
                        Our team will contact you at the email or phone number below
                        to arrange secure payment before shipping.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Email Address (For Order Receipt)
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-slate-100 border-none rounded-xl text-xs p-2.5 font-medium focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Items Subtotal ({checkoutItems.length}):</span>
                    <span className="font-semibold">
                      RWF {itemsBasePrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee ({locationType === "rwanda" ? province : "Abroad"}):</span>
                    <span className="font-semibold text-emerald-600">
                      {deliveryFee === 0 ? "FREE" : `+ RWF ${deliveryFee.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-black text-sm">
                    <span>Total Amount:</span>
                    <span>RWF {finalTotalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* DYNAMIC INTOUCH / PRIMARY CHECKOUT BUTTON */}
                {locationType === "rwanda" ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-extrabold py-3.5 rounded-2xl text-xs transition shadow-lg mt-2 flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? "Connecting to InTouch Pay..."
                        : `Pay RWF ${finalTotalPrice.toLocaleString()} via InTouch Pay`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black hover:bg-slate-800 disabled:bg-slate-400 text-white font-extrabold py-3.5 rounded-2xl text-xs transition shadow-lg mt-2"
                  >
                    {isSubmitting
                      ? "Processing Order..."
                      : `Reserve Order - RWF ${finalTotalPrice.toLocaleString()}`}
                  </button>
                )}
              </form>
            )}

            {paymentStatus === "processing" && (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  {locationType === "rwanda"
                    ? "InTouch Pay Request Sent..."
                    : "Reserving Your Order..."}
                </h4>
                <p className="text-xs text-slate-500">
                  {locationType === "rwanda"
                    ? "Please check your phone (+250 " + customerPhone + ") and approve the MTN MoMo / Airtel Money prompt."
                    : "We're saving your order details for our team to follow up."}
                </p>
              </div>
            )}

            {paymentStatus === "error" && (
              <div className="py-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h4 className="font-extrabold text-base text-slate-900">
                  Payment Request Failed
                </h4>
                <p className="text-xs text-slate-600">
                  {errorMessage || "We could not process your order at this moment."}
                </p>
                <button
                  onClick={() => setPaymentStatus("form")}
                  className="bg-black text-white font-bold px-6 py-2.5 rounded-xl text-xs"
                >
                  Try Again
                </button>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="py-8 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                <h4 className="font-extrabold text-lg text-slate-900">
                  Order Placed Successfully!
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We sent an automated email receipt to <b>{customerEmail}</b>. Our support team will contact you shortly on{" "}
                  <b>
                    {locationType === "rwanda"
                      ? `+250${customerPhone || ""}`
                      : customerPhone || ""}
                  </b>{" "}
                  {locationType === "rwanda"
                    ? "for immediate delivery."
                    : "to arrange payment and shipping."}
                </p>
                {orderReference && (
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Order Reference:{" "}
                    <span className="font-mono text-slate-800">{orderReference}</span>
                  </p>
                )}
                <button
                  onClick={closeModal}
                  className="bg-black text-white font-bold px-6 py-2.5 rounded-xl text-xs mt-2"
                >
                  Close & Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Section */}
      <footer className="bg-gray-900 text-gray-300 text-xs border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="Kigali Shoes Hub Logo"
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
              <span className="font-bold text-white text-sm">Kigali Shoes Hub</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Your premier destination for high quality footwear in Kigali. Guaranteed authenticity and swift local delivery.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-white font-bold text-sm block mb-3">Customer Care</span>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveView("how-to-buy")} className="hover:text-white transition-colors">
                  How To Buy
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView("returns")} className="hover:text-white transition-colors">
                  Return & Refunds Policy
                </button>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <span className="text-white font-bold text-sm block mb-3">Quick Links</span>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveView("products")} className="hover:text-white transition-colors">
                  All Footwear
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView("about")} className="hover:text-white transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => setActiveView("contact")} className="hover:text-white transition-colors">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <span className="text-white font-bold text-sm block mb-3">Contact Support</span>
            <p className="text-gray-400">Call / Help Line: {DISPLAY_HELPLINE}</p>
            <p className="text-gray-400">Location: Kigali City, Rwanda</p>
            <div className="pt-2">
              <span className="text-white font-bold text-xs block mb-2">Social Platforms</span>
              <div className="flex items-center gap-2">
                <a
                  href={SOCIAL_HANDLES.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 hover:bg-white hover:text-black rounded-lg transition text-gray-300 flex items-center justify-center"
                  title="Facebook: kigali.shoes.hub"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
                <a
                  href={SOCIAL_HANDLES.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 hover:bg-white hover:text-black rounded-lg transition text-gray-300 flex items-center justify-center"
                  title="Instagram: kigali.shoes.hub"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a
                  href={SOCIAL_HANDLES.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-800 hover:bg-white hover:text-black rounded-lg transition text-gray-300 flex items-center justify-center"
                  title="TikTok: kigali.shoes.hub"
                >
                  <TikTokIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 bg-black py-4 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-gray-400 text-[11px]">
            <span>© {new Date().getFullYear()} Kigali Shoes Hub. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}