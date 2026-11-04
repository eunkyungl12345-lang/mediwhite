/** 🗺️ 서울 구 단위 (병원 테이블에 컬럼을 못 늘려서 settings에 "hdist:<병원id>" = "강남구" 로 저장) */
export const SEOUL_GU = ["강남구", "서초구", "송파구", "강동구", "마포구", "용산구", "성동구", "광진구", "중구", "종로구", "영등포구", "동작구", "관악구", "강서구", "양천구", "구로구", "금천구", "서대문구", "은평구", "성북구", "강북구", "도봉구", "노원구", "중랑구", "동대문구"] as const;
export const distKey = (hid: number) => `hdist:${hid}`;
export const isGu = (v: string) => (SEOUL_GU as readonly string[]).includes(v);
