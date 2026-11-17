// src/utils/address.js
// Helper alamat rumah pengguna (disimpan di currentUser.address)

export const EMPTY_ADDRESS = {
  street: "",      // Nama jalan, nomor rumah, blok
  rtRw: "",        // RT/RW
  kelurahan: "",
  kecamatan: "",
  city: "",
  province: "",
  postalCode: "",
  notes: "",       // Patokan (opsional)
};

// Field wajib agar alamat dianggap lengkap
export const REQUIRED_ADDRESS_FIELDS = ["street", "kelurahan", "kecamatan", "city", "province", "postalCode"];

export function isAddressComplete(address) {
  if (!address) return false;
  return REQUIRED_ADDRESS_FIELDS.every((k) => String(address[k] || "").trim());
}

/** Alamat dalam satu baris, untuk ditampilkan */
export function formatAddress(address) {
  if (!address) return "";
  const a = address;
  return [
    a.street,
    a.rtRw && `RT/RW ${a.rtRw}`,
    a.kelurahan && `Kel. ${a.kelurahan}`,
    a.kecamatan && `Kec. ${a.kecamatan}`,
    a.city,
    a.province,
    a.postalCode,
  ]
    .filter((x) => String(x || "").trim())
    .join(", ");
}

/** Query pencarian Google Maps (tanpa RT/RW & patokan agar hasil peta akurat) */
export function addressMapQuery(address) {
  if (!address) return "";
  return [address.street, address.kelurahan, address.kecamatan, address.city, address.province, address.postalCode]
    .filter((x) => String(x || "").trim())
    .join(", ");
}
