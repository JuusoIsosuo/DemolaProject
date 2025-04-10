# MultipleRoutes Component Structure

```text
MultipleRoutes
├─► Map (when activeTab = 'kartta')
│   └── Receives:
│       - selectedRoutesData (filtered route data)
│
├─► StatsView (when activeTab = 'tilastot')
│   └── Receives:
│       - routes
│       - selectedRoutes
│
├─► AddRouteForm
│   └── Receives:
│       - routes
│       - setRoutes
│       - selectedRoutes
│       - setSelectedRoutes
│       - isLoading
│       - setIsLoading
│
└─► RouteDetails
    └── Receives:
        - routes
        - selectedRoutes
        - setSelectedRoutes
 ```
 
## Component Details

### **Map Component**
- Receives: `selectedRoutesData` (filtered route data)
- Displays only selected routes
- One-way data flow – does **not** modify parent state

---

### **StatsView Component**
- Receives: `routes`, `selectedRoutes`
- Calculates and displays route statistics
- One-way data flow – does **not** modify parent state

---

### **AddRouteForm Component**
- Handles adding routes
- Handles PDFs
- Receives setter functions:
  - `setRoutes` to add new routes
  - `setSelectedRoutes` to update selection
  - `setIsLoading` to manage loading state during API calls
- Has full control over route data and selection state

---

### **RouteDetails Component**
- Displays all routes
- Can update selected routes via `setSelectedRoutes`
- Handles deleting routes
- Manages its own sorting state internally

---

## 🔁 State Updates Flow

### When a new route is added:
- **AddRouteForm** updates `routes` and `selectedRoutes`
- Triggers re-renders in **Map**, **StatsView**, and **RouteDetails**

### When routes are selected/deselected:
- **RouteDetails** updates `selectedRoutes`
- Affects data displayed in **Map** and **StatsView**

### When a route is deleted:
- **RouteDetails** calls `onDeleteRoute`
- **MultipleRoutes** updates `routes` and `selectedRoutes`
- All components re-render with updated data
