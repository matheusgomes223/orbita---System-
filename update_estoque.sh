#!/bin/bash
cat src/components/Estoque.tsx | sed 's/import { Search, Download, Filter, MoreVertical, ImageIcon, ArrowUpRight, ArrowDownRight } from .lucide-react.;/import { Search, Download, Filter, MoreVertical, ImageIcon, ArrowUpRight, ArrowDownRight, X, User, MapPin, Building, Package, Tag, Hash, Calendar, DollarSign, BookOpen, AlertCircle, FileText } from "lucide-react";/' > temp.tsx
mv temp.tsx src/components/Estoque.tsx
