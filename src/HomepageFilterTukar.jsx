
// export default function HomepageFilterTukar() {
//   return (
//     <div className="flex flex-col items-start bg-[#F6FAF7] w-full min-h-screen p-8">
//       <h1 className="text-3xl font-bold">TradeMe</h1>
//       <p>Temukan barang bekas yang masih layak pakai.</p>
//     </div>
//   );
// }

export default function HomepageFilterTukar() {
  return (
    <div className="flex flex-col items-start bg-[#F6FAF7] min-w-screen min-h-screen absolute left-[2375px] top-[334px]">
      <div className="flex min-w-[320px] min-h-[726.667px] flex-col items-start bg-[#F6FAF7] w-full">
        <div className="flex flex-col items-start border-b-[0.56px] border-b-[rgba(47,125,91,0.12)] bg-[rgba(255,255,255,0.94)] w-full">
          <div className="flex flex-col items-center w-full">
            <div className="flex min-h-[76px] items-center gap-7 w-[882px] h-[76px]">
              <div className="flex items-center gap-2.5 w-fit">
                <div className="grid rounded-[11px] bg-[#2F7D5B] shadow-[06px16px0rgba(47,125,91,0.22)] w-[35px] h-[35px]">
                  <p className="text-[#FFF] font-plusJakartaSans text-[19px] font-extrabold leading-[28.5px] w-fit tracking-[-0.0368em]">
                    T
                  </p>
                </div>
                <div className="flex flex-col items-center w-fit">
                  <p className="text-[#1F2A24] font-plusJakartaSans text-[21px] font-extrabold leading-[31.5px] w-fit tracking-[-0.0333em]">
                    TradeMe
                  </p>
                </div>
              </div>
              <div className="flex justify-end items-start w-full">
                <div className="flex flex-col justify-center items-start w-fit">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 overflow-hidden relative "
                  >
                    <path
                      d="M3.33325 5.83398H16.6666M3.33325 10.0007H16.6666M3.33325 14.1673H16.6666"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      stroke="#1F2A24"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex pt-7 flex-col items-center w-full">
          <div className="grid max-w-[768px] min-h-[470px] rounded-[28px] bg-[#2F7D5B] shadow-[018px42px0rgba(31,96,68,0.15)] w-[768px] h-[892px] overflow-hidden">
            <div className="flex p-12 flex-col justify-center items-start w-full h-full">
              <div className="flex flex-col items-start opacity-[78%] w-full">
                <p className="text-[#FFF] font-plusJakartaSans text-[11px] font-extrabold leading-[16.5px] w-fit tracking-[0.1636em]">
                  Barang lama, manfaat baru
                </p>
              </div>
              <div className="flex pt-[15px] pr-0 pb-[18px] pl-0 flex-col items-start w-full">
                <div className="flex max-w-[620px] flex-col items-start w-full h-[42px]">
                  <p className="text-[#F5C764] font-plusJakartaSans text-[40px] leading-[41.2px] w-fit tracking-[-0.0675em]">
                    Beri barang kesempatan kedua.
                  </p>
                </div>
              </div>
              <div className="flex max-w-[590px] flex-col items-start w-full">
                <p className="text-[#DCEEE4] font-plusJakartaSans text-base leading-[27.2px] w-[590px]">
                  Jual, tukar, lelang, atau donasikan barang layak pakai. Lebih
                  hemat untuk sesama, lebih baik untuk bumi.
                </p>
              </div>
              <div className="flex pt-[30px] items-center gap-6 w-[672px] h-[76px]">
                <button className="cursor-pointer text-nowrap flex min-h-[46px] py-0 px-5 justify-center items-center gap-[9px] rounded-xl bg-[#FFF] w-fit">
                  <p className="text-[#1F6044] font-plusJakartaSans text-base font-bold leading-6 w-fit">
                    Jelajahi Barang
                  </p>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 overflow-hidden relative "
                  >
                    <path
                      d="M4.1665 10H15.8332M10.8332 15L15.8332 10L10.8332 5"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      stroke="#1F6044"
                    />
                  </svg>
                </button>
                <button className="cursor-pointer text-nowrap flex flex-col justify-center items-center w-fit">
                  <p className="text-[#FFF] font-plusJakartaSans text-base font-bold leading-6 w-fit">
                    Mulai Berdonasi
                  </p>
                </button>
              </div>
              <div className="w-full h-[65px] relative">
                <p className="text-[#FFF] font-plusJakartaSans text-base font-bold leading-6 w-[65px] h-6 absolute left-0 top-[41px]">
                  12.480+
                </p>
                <p className="text-[#CCE1D5] font-plusJakartaSans text-[11px] leading-[16.5px] w-[159px] h-[17px] absolute left-[72px] top-[46px]">
                  barang mendapat pemilik baru
                </p>
                <div className="bg-[rgba(255,255,255,0.25)] w-px h-[23px] absolute left-[247px] top-9"></div>
                <p className="text-[#FFF] font-plusJakartaSans text-base font-bold leading-6 w-[54px] h-6 absolute left-[265px] top-[41px]">
                  2.150+
                </p>
                <p className="text-[#CCE1D5] font-plusJakartaSans text-[11px] leading-[16.5px] w-[95px] h-[17px] absolute left-[325px] top-[46px]">
                  donasi tersalurkan
                </p>
              </div>
            </div>
            <div className="flex min-h-[300px] flex-col items-start w-full h-full relative">
              <img
                src="/ImageKoleksiFurniturBekasYangMasihLayakPakai.png"
                className="w-full h-[510px] overflow-hidden max-w-none"
                alt="Image (Koleksi furnitur bekas yang masih layak pakai)"
              />
              <div className="absolute top-0 bg-linear-[180deg,#2F7D5B0%,rgba(47,125,91,0.00)40%] w-[768px] h-[510px]"></div>
              <div className="flex py-[13px] px-4 items-center gap-3 absolute right-[25px] bottom-[25px] rounded-[14px] bg-[rgba(255,255,255,0.95)] shadow-[014px35px0rgba(31,74,51,0.08)] w-fit">
                <div className="grid rounded-[10px] bg-[#E5F2EB] w-[39px] h-[39px]">
                  <div className="w-5 h-5 overflow-hidden relative">
                    <svg
                      width="15"
                      height="19"
                      viewBox="0 0 15 19"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-[13px] h-[17px] absolute left-[3px] top-0.5 "
                    >
                      <path
                        d="M7.41667 17.4167C7.41667 17.4167 14.0833 14.0833 14.0833 9.08333V3.25L7.41667 0.75L0.75 3.25V9.08333C0.75 14.0833 7.41667 17.4167 7.41667 17.4167Z"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="#2F7D5B"
                      />
                    </svg>
                    <svg
                      width="7"
                      height="6"
                      viewBox="0 0 7 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-[5px] h-1 absolute left-2 top-2 "
                    >
                      <path
                        d="M0.75 3.25L2.41667 4.91667L5.75 0.75"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="#2F7D5B"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col items-start w-32">
                  <div className="flex flex-col items-start w-full">
                    <p className="text-[#1F2A24] font-plusJakartaSans text-xs font-bold leading-[18px] w-fit">
                      Aman &amp; Terverifikasi
                    </p>
                  </div>
                  <div className="flex pt-0.5 flex-col items-start w-32 h-[17px]">
                    <p className="text-[#66736C] font-plusJakartaSans text-[10px] leading-[15px] w-fit">
                      Transaksi dilindungi escrow
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center w-full">
          <div className="flex max-w-[768px] pt-[76px] pr-0 pb-[90px] pl-0 flex-col items-start w-[768px]">
            <div className="flex justify-between items-end w-full">
              <div className="flex flex-col items-start w-[317px]">
                <div className="flex pt-[5px] pr-[170px] pb-0.5 pl-0 items-center w-full h-6">
                  <p className="text-[#2F7D5B] font-plusJakartaSans text-[11px] font-extrabold leading-[16.5px] w-[147px] h-[17px] tracking-[0.1636em]">
                    Temukan pilihanmu
                  </p>
                </div>
                <div className="flex pt-2 flex-col items-start w-[317px] h-[50px]">
                  <p className="text-[#1F2A24] font-plusJakartaSans text-[28px] leading-[41.5px] w-fit tracking-[-0.0434em]">
                    Barang terbaru di dekatmu
                  </p>
                </div>
              </div>
              <div className="flex min-h-[40px] py-0 px-3.5 items-center gap-1.5 rounded-[20px] border-[0.56px] border-[#DCE6DF] bg-[#FFF] w-fit">
                <div className="w-[17px] h-[17px] overflow-hidden relative">
                  <svg
                    width="13"
                    height="16"
                    viewBox="0 0 13 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-[11px] h-3.5 absolute left-[3px] top-px "
                  >
                    <path
                      d="M11.9685 6.30222C11.9685 9.84316 6.30295 14.8005 6.30295 14.8005C6.30295 14.8005 0.637451 9.84316 0.637451 6.30222C0.637451 4.79963 1.23435 3.35859 2.29684 2.29611C3.35933 1.23362 4.80037 0.636719 6.30295 0.636719C7.80554 0.636719 9.24658 1.23362 10.3091 2.29611C11.3716 3.35859 11.9685 4.79963 11.9685 6.30222Z"
                      strokeWidth="1.27474"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      stroke="#1F6044"
                    />
                  </svg>
                  <svg
                    width="5"
                    height="5"
                    viewBox="0 0 5 5"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-1 h-1 absolute left-[7px] top-[5px] "
                  >
                    <path
                      d="M4.17839 2.40719C4.17839 3.38499 3.38572 4.17766 2.40792 4.17766C1.43012 4.17766 0.637451 3.38499 0.637451 2.40719C0.637451 1.42938 1.43012 0.636719 2.40792 0.636719C3.38572 0.636719 4.17839 1.42938 4.17839 2.40719Z"
                      strokeWidth="1.27474"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      stroke="#1F6044"
                    />
                  </svg>
                </div>
                <p className="text-[#1F6044] font-plusJakartaSans text-xs leading-[18px] w-fit">
                  Surabaya
                </p>
              </div>
            </div>
            <div className="flex pt-7 flex-col items-center w-full">
              <div className="flex justify-between items-center w-full">
                <div className="flex p-[5px] items-start gap-[5px] rounded-[14px] border-[0.56px] border-[#DCE6DF] bg-[#FFF] w-fit">
                  <button className="cursor-pointer text-nowrap flex py-[9px] px-[18px] flex-col justify-center items-center rounded-[9px] w-fit h-full">
                    <p className="text-[#6A756F] font-plusJakartaSans text-xs font-bold leading-[18px] w-fit">
                      Semua
                    </p>
                  </button>
                  <button className="cursor-pointer text-nowrap flex py-[9px] px-[18px] flex-col justify-center items-center rounded-[9px] w-fit h-full">
                    <p className="text-[#6A756F] font-plusJakartaSans text-xs font-bold leading-[18px] w-fit">
                      Jual
                    </p>
                  </button>
                  <button className="cursor-pointer text-nowrap flex py-[9px] px-[18px] flex-col justify-center items-center rounded-[9px] bg-[#2F7D5B] shadow-[04px10px0rgba(47,125,91,0.16)] w-fit h-full">
                    <p className="text-[#FFF] font-plusJakartaSans text-xs font-bold leading-[18px] w-fit">
                      Tukar
                    </p>
                  </button>
                  <button className="cursor-pointer text-nowrap flex py-[9px] px-[18px] flex-col justify-center items-center rounded-[9px] w-fit h-full">
                    <p className="text-[#6A756F] font-plusJakartaSans text-xs font-bold leading-[18px] w-fit">
                      Lelang
                    </p>
                  </button>
                  <button className="cursor-pointer text-nowrap flex py-[9px] px-[18px] flex-col justify-center items-center rounded-[9px] w-fit h-full">
                    <p className="text-[#6A756F] font-plusJakartaSans text-xs font-bold leading-[18px] w-fit">
                      Donasi
                    </p>
                  </button>
                </div>
                <div className="flex min-h-[40px] py-0 px-3 items-center gap-2 rounded-[10px] border-[0.56px] border-[#DCE6DF] bg-[#FFF] w-fit">
                  <div className="w-[17px] h-[17px] overflow-hidden relative">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-2.5 h-2.5 absolute left-[3px] top-[3px] "
                    >
                      <path
                        d="M10.5521 5.59403C10.5521 8.33188 8.33261 10.5513 5.59476 10.5513C2.85692 10.5513 0.637451 8.33188 0.637451 5.59403C0.637451 2.85618 2.85692 0.636719 5.59476 0.636719C8.33261 0.636719 10.5521 2.85618 10.5521 5.59403Z"
                        strokeWidth="1.27474"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="#8A948E"
                      />
                    </svg>
                    <svg
                      width="5"
                      height="5"
                      viewBox="0 0 5 5"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-[3px] h-[3px] absolute left-[11px] top-[11px] "
                    >
                      <path
                        d="M3.4702 3.46947L0.637451 0.636719"
                        strokeWidth="1.27474"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="#8A948E"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col justify-center items-start w-[173px] h-6 overflow-hidden">
                    <p className="text-[rgba(31,42,36,0.50)] font-plusJakartaSans text-base w-full">
                      Cari barang...
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex pt-[18px] items-center gap-2.5 w-[768px] h-14">
              <div className="flex min-h-[38px] pt-px pr-0 pb-px pl-4 justify-end items-start gap-[25px] rounded-[9px] border-[0.56px] border-[#DCE6DF] w-[140px] h-[38px] overflow-hidden">
                <div className="flex items-center w-20 h-[37px] overflow-hidden">
                  <p className="text-[#536159] font-plusJakartaSans text-xs w-fit">
                    Kategori
                  </p>
                </div>
                <div className="flex justify-center items-center w-5 h-[37px]">
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-2.5 h-1.5 relative "
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      stroke="#536159"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex min-h-[38px] pt-px pr-0 pb-px pl-4 justify-end items-start gap-[25px] rounded-[9px] border-[0.56px] border-[#DCE6DF] w-[140px] h-[38px] overflow-hidden">
                <div className="flex items-center w-20 h-[37px] overflow-hidden">
                  <p className="text-[#536159] font-plusJakartaSans text-xs w-fit">
                    Kondisi
                  </p>
                </div>
                <div className="flex justify-center items-center w-5 h-[37px]">
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-2.5 h-1.5 relative "
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      stroke="#536159"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex min-h-[38px] pt-px pr-0 pb-px pl-4 justify-end items-start gap-[25px] rounded-[9px] border-[0.56px] border-[#DCE6DF] w-[140px] h-[38px] overflow-hidden">
                <div className="flex items-center w-20 h-[37px] overflow-hidden">
                  <p className="text-[#536159] font-plusJakartaSans text-xs w-fit">
                    Lokasi
                  </p>
                </div>
                <div className="flex justify-center items-center w-5 h-[37px]">
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-2.5 h-1.5 relative "
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      stroke="#536159"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex min-h-[38px] pt-px pr-0 pb-px pl-4 justify-end items-start gap-[25px] rounded-[9px] border-[0.56px] border-[#DCE6DF] w-[140px] h-[38px] overflow-hidden">
                <div className="flex items-center w-20 h-[37px] overflow-hidden">
                  <p className="text-[#536159] font-plusJakartaSans text-xs w-fit">
                    Harga
                  </p>
                </div>
                <div className="flex justify-center items-center w-5 h-[37px]">
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-2.5 h-1.5 relative "
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      stroke="#536159"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex justify-end items-start w-full">
                <div className="flex flex-col items-start w-fit">
                  <p className="text-[#879189] font-plusJakartaSans text-[11px] leading-[16.5px] w-fit">
                    2 barang ditemukan
                  </p>
                </div>
              </div>
            </div>
            <div className="flex pt-[25px] flex-col items-start w-full">
              <div className="inline-grid w-full relative">
                <div className="flex flex-col justify-center items-start rounded-[17px] border-[0.56px] border-[rgba(220,230,223,0.80)] bg-[#FFF] shadow-[08px26px0rgba(36,76,53,0.06)] w-full h-full absolute left-0 top-0 overflow-hidden relative">
                  <div className="w-full h-[202px]"></div>
                  <div className="flex pt-[15px] pr-[15px] pb-3.5 pl-[15px] flex-col items-start w-full">
                    <div className="flex flex-col items-start w-full">
                      <p className="text-[#1F2A24] font-plusJakartaSans text-sm leading-[21px] w-fit tracking-[-0.0143em]">
                        Meja Makan Kayu Jati
                      </p>
                    </div>
                    <div className="flex min-h-[19px] pt-2 flex-col items-start w-[212px] h-[27px]">
                      <p className="text-[#2F7D5B] font-plusJakartaSans text-[11px] font-bold leading-[16.5px] w-fit">
                        Terbuka untuk ditukar
                      </p>
                    </div>
                    <div className="flex pt-[11px] flex-col items-start w-full">
                      <div className="flex pt-2.5 justify-between items-start border-t-[0.56px] border-t-[#EEF2EF] w-full h-[26px]">
                        <div className="flex items-center gap-[3px] w-fit h-full">
                          <div className="w-[15px] h-[15px] overflow-hidden relative">
                            <svg
                              width="12"
                              height="14"
                              viewBox="0 0 12 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-2.5 h-[13px] absolute left-[3px] top-px "
                            >
                              <path
                                d="M10.5625 5.5625C10.5625 8.6875 5.5625 13.0625 5.5625 13.0625C5.5625 13.0625 0.5625 8.6875 0.5625 5.5625C0.5625 4.23642 1.08928 2.96465 2.02697 2.02697C2.96465 1.08928 4.23642 0.5625 5.5625 0.5625C6.88858 0.5625 8.16035 1.08928 9.09803 2.02697C10.0357 2.96465 10.5625 4.23642 10.5625 5.5625Z"
                                strokeWidth="1.125"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                stroke="#7A857E"
                              />
                            </svg>
                            <svg
                              width="5"
                              height="5"
                              viewBox="0 0 5 5"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-[3px] h-[3px] absolute left-1.5 top-[5px] "
                            >
                              <path
                                d="M3.6875 2.125C3.6875 2.98794 2.98794 3.6875 2.125 3.6875C1.26206 3.6875 0.5625 2.98794 0.5625 2.125C0.5625 1.26206 1.26206 0.5625 2.125 0.5625C2.98794 0.5625 3.6875 1.26206 3.6875 2.125Z"
                                strokeWidth="1.125"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                stroke="#7A857E"
                              />
                            </svg>
                          </div>
                          <p className="text-[#7A857E] font-plusJakartaSans text-[10px] leading-[14.25px] w-fit">
                            Rungkut
                          </p>
                        </div>
                        <div className="flex items-center gap-[3px] w-fit h-full">
                          <p className="text-[#7A857E] font-plusJakartaSans text-[10px] leading-[14.25px] w-fit">
                            Sangat baik
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start absolute left-px top-px bg-[#E9EEE9] w-[242px] h-[202px] overflow-hidden relative">
                    <img
                      src="/ImageMejaMakanKayuJati.png"
                      className="shrink-0 w-full h-[202px] overflow-hidden max-w-none"
                      alt="Image (Meja Makan Kayu Jati)"
                    />
                    <div className="flex py-[5px] px-2.5 items-center absolute left-3 top-3 rounded-[20px] bg-[#E2EDFA] w-fit h-[25px]">
                      <p className="text-[#27659D] font-plusJakartaSans text-[10px] font-extrabold leading-[15px] w-fit">
                        Tukar
                      </p>
                    </div>
                    <div className="grid absolute right-3 top-3 rounded-[15.5px] bg-[rgba(255,255,255,0.92)] w-[31px] h-[31px]">
                      <p className="text-[#1F2A24] font-plusJakartaSans text-[19px] leading-[28.5px] w-fit">
                        ♡
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center items-start rounded-[17px] border-[0.56px] border-[rgba(220,230,223,0.80)] bg-[#FFF] shadow-[08px26px0rgba(36,76,53,0.06)] w-full h-full absolute left-[262px] -top-0 overflow-hidden relative">
                  <div className="w-full h-[202px]"></div>
                  <div className="flex pt-[15px] pr-[15px] pb-3.5 pl-[15px] flex-col items-start w-full">
                    <div className="flex flex-col items-start w-full">
                      <p className="text-[#1F2A24] font-plusJakartaSans text-sm leading-[21px] w-fit tracking-[-0.0143em]">
                        Sepeda Keranjang Hijau
                      </p>
                    </div>
                    <div className="flex min-h-[19px] pt-2 flex-col items-start w-[212px] h-[27px]">
                      <p className="text-[#2F7D5B] font-plusJakartaSans text-[11px] font-bold leading-[16.5px] w-fit">
                        Terbuka untuk ditukar
                      </p>
                    </div>
                    <div className="flex pt-[11px] flex-col items-start w-full">
                      <div className="flex pt-2.5 justify-between items-start border-t-[0.56px] border-t-[#EEF2EF] w-full h-[26px]">
                        <div className="flex items-center gap-[3px] w-fit h-full">
                          <div className="w-[15px] h-[15px] overflow-hidden relative">
                            <svg
                              width="12"
                              height="14"
                              viewBox="0 0 12 14"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-2.5 h-[13px] absolute left-[3px] top-px "
                            >
                              <path
                                d="M10.5625 5.5625C10.5625 8.6875 5.5625 13.0625 5.5625 13.0625C5.5625 13.0625 0.5625 8.6875 0.5625 5.5625C0.5625 4.23642 1.08928 2.96465 2.02697 2.02697C2.96465 1.08928 4.23642 0.5625 5.5625 0.5625C6.88858 0.5625 8.16035 1.08928 9.09803 2.02697C10.0357 2.96465 10.5625 4.23642 10.5625 5.5625Z"
                                strokeWidth="1.125"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                stroke="#7A857E"
                              />
                            </svg>
                            <svg
                              width="5"
                              height="5"
                              viewBox="0 0 5 5"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-[3px] h-[3px] absolute left-1.5 top-[5px] "
                            >
                              <path
                                d="M3.6875 2.125C3.6875 2.98794 2.98794 3.6875 2.125 3.6875C1.26206 3.6875 0.5625 2.98794 0.5625 2.125C0.5625 1.26206 1.26206 0.5625 2.125 0.5625C2.98794 0.5625 3.6875 1.26206 3.6875 2.125Z"
                                strokeWidth="1.125"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                stroke="#7A857E"
                              />
                            </svg>
                          </div>
                          <p className="text-[#7A857E] font-plusJakartaSans text-[10px] leading-[14.25px] w-fit">
                            Darmo
                          </p>
                        </div>
                        <div className="flex items-center gap-[3px] w-fit h-full">
                          <p className="text-[#7A857E] font-plusJakartaSans text-[10px] leading-[14.25px] w-fit">
                            Baik
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start absolute left-px top-px bg-[#E9EEE9] w-[242px] h-[202px] overflow-hidden relative">
                    <img
                      src="/ImageSepedaKeranjangHijau.png"
                      className="shrink-0 w-full h-[202px] overflow-hidden max-w-none"
                      alt="Image (Sepeda Keranjang Hijau)"
                    />
                    <div className="flex py-[5px] px-2.5 items-center absolute left-3 top-3 rounded-[20px] bg-[#E2EDFA] w-fit h-[25px]">
                      <p className="text-[#27659D] font-plusJakartaSans text-[10px] font-extrabold leading-[15px] w-fit">
                        Tukar
                      </p>
                    </div>
                    <div className="grid absolute right-3 top-3 rounded-[15.5px] bg-[rgba(255,255,255,0.92)] w-[31px] h-[31px]">
                      <p className="text-[#1F2A24] font-plusJakartaSans text-[19px] leading-[28.5px] w-fit">
                        ♡
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex py-[35px] px-0 flex-col items-start border-t-[0.56px] border-t-[#DCE6DF] bg-[#FFF] w-full">
          <div className="flex flex-col items-center w-full">
            <div className="inline-grid max-w-[768px] w-[768px] relative">
              <div className="flex items-center gap-2.5 w-full absolute left-0 top-0">
                <div className="grid rounded-[11px] bg-[#2F7D5B] shadow-[06px16px0rgba(47,125,91,0.22)] w-[35px] h-[35px]">
                  <p className="text-[#FFF] font-plusJakartaSans text-[19px] font-extrabold leading-[28.5px] w-fit tracking-[-0.0368em]">
                    T
                  </p>
                </div>
                <div className="flex flex-col items-center w-fit">
                  <p className="text-[#1F2A24] font-plusJakartaSans text-[21px] font-extrabold leading-[31.5px] w-fit tracking-[-0.0333em]">
                    TradeMe
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start w-full h-[15px] absolute left-[155px] top-2.5">
                <p className="text-[#66736C] font-plusJakartaSans text-[10px] leading-[15px] w-fit">
                  Memberi nilai baru pada barang lama.
                </p>
              </div>
              <div className="flex items-start gap-[15px] w-full h-[15px] absolute left-[651px] top-2.5">
                <button className="cursor-pointer text-nowrap flex flex-col justify-center items-center w-fit h-full">
                  <p className="text-[#1F2A24] font-plusJakartaSans text-[10px] leading-[15px] w-fit">
                    Donasi
                  </p>
                </button>
                <button className="cursor-pointer text-nowrap flex flex-col justify-center items-center w-fit h-full">
                  <p className="text-[#1F2A24] font-plusJakartaSans text-[10px] leading-[15px] w-fit">
                    Profil
                  </p>
                </button>
                <button className="cursor-pointer text-nowrap flex flex-col justify-center items-center w-fit h-full">
                  <p className="text-[#1F2A24] font-plusJakartaSans text-[10px] leading-[15px] w-fit">
                    Keluar
                  </p>
                </button>
              </div>
              <div className="flex pt-[17px] flex-col items-start border-t-[0.56px] border-t-[#EDF1EE] w-full h-[30px] absolute left-0 top-[60px]">
                <p className="text-[#95A099] font-plusJakartaSans text-[8px] leading-3 w-fit">
                  © 2026 TradeMe · Mendukung SDG 1: Tanpa Kemiskinan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}