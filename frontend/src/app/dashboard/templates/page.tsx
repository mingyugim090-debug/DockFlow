import { Search, Mic, Plus, FileText, Briefcase, Calculator } from 'lucide-react';

export default function Templates() {
  const categories = ["모든 템플릿", "공인중개사용", "세무/회계", "영업/마케팅", "계약서"];
  
  const templates = [
    { title: "아파트 매매 계약서", info: "표준 서식 기반", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "월세 수입 정산표", info: "엑셀 수식 자동포함", icon: Calculator, color: "text-green-500", bg: "bg-green-50" },
    { title: "신규 매물 소개 자료", info: "고객 브리핑용 PPT", icon: Briefcase, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "월간 업무 보고서", info: "주요 KPI 현황 정리", icon: FileText, color: "text-orange-500", bg: "bg-orange-50" },
    { title: "부동산 시세 분석", info: "지역별 매매 비교", icon: Briefcase, color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="w-full h-full bg-[#fcfcfc] min-h-screen md:pl-20">
      {/* Top Banner Area with Search */}
      <div className="w-full bg-[#f3f4f6]/50 py-16 px-10 flex justify-center border-b border-gray-200">
        <div className="w-full max-w-4xl flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">어떤 문서를 시작할까요?</h1>
          
          <div className="w-full relative bg-white border border-gray-200 rounded-[2rem] flex items-center px-6 py-4 gs-shadow-lg focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 mr-3">
              <Plus size={24} />
            </button>
            <input 
              type="text" 
              placeholder="만들고 싶은 문서를 설명해주세요 (예: 부동산 계약서, 정산표...)" 
              className="w-full bg-transparent text-xl outline-none placeholder:text-gray-400 text-gray-900 font-medium"
            />
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 ml-3">
              <Mic size={24} />
            </button>
            <button className="ml-4 bg-gray-900 text-white rounded-full px-8 py-3 text-base font-bold hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-md">
              문서 생성
            </button>
          </div>
        </div>
      </div>

      {/* Main Templates Area */}
      <div className="w-full max-w-7xl mx-auto px-10 py-10">
        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar mb-10 pb-2">
          {categories.map((cat, i) => (
            <button 
              key={cat} 
              className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${i === 0 ? 'bg-gray-900 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mx-auto">
          
          {/* Blank Document Card */}
          <button className="group h-[320px] bg-white border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
              <Plus size={32} />
            </div>
            <div className="text-center">
              <span className="block font-bold text-gray-900">빈 문서</span>
              <span className="text-xs text-gray-500 mt-1">새로 만들기</span>
            </div>
          </button>

          {/* Preset Template Cards */}
          {templates.map((tpl, i) => (
            <div key={i} className="group h-[320px] bg-white border border-gray-200 rounded-3xl p-8 flex flex-col items-start gap-5 hover:gs-shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Plus size={16} />
                </div>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tpl.bg} ${tpl.color} group-hover:scale-110 transition-transform`}>
                <tpl.icon size={28} />
              </div>
              <div className="mt-auto">
                <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{tpl.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{tpl.info}</p>
              </div>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}
