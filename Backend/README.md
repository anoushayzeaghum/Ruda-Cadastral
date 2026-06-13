**For Sana**
password: admin123
"GDAL_LIBRARY_PATH": "C:/Program Files/QGIS 3.34.15/bin/gdal310.dll",
"GEOS_LIBRARY_PATH": "C:/Program Files/QGIS 3.34.15/bin/geos_c.dll"

**For Anoushay**
password: postgres
"GDAL_LIBRARY_PATH": "C:/Program Files/QGIS 3.34.3/bin/gdal308.dll",
"GEOS_LIBRARY_PATH": "C:/Program Files/QGIS 3.34.3/bin/geos_c.dll"

**For Imam**
password: postgres
"GDAL_LIBRARY_PATH": "C:/Program Files/QGIS 3.44.1/bin/gdal311.dll",
"GEOS_LIBRARY_PATH": "C:/Program Files/QGIS 3.44.1/bin/geos_c.dll"

**Make Migration Command**
python manage.py makemigrations --settings=server.settings.local

**Migrate Command**
python manage.py migrate --settings=server.settings.local

**To run backend server Command**
python manage.py runserver --settings=server.settings.local

**To activate Environment for backend**
python -m venv venv
venv\Scripts\Activate **(RUN THIS ONLY TO ACTIVATE ENVIRONMENT)**
pip install -r requirements.txt

SQ QUERIES:

-- =====================================================
-- SOCIETY TABLE
-- =====================================================
ALTER TABLE public.society
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS source VARCHAR(255),
ADD COLUMN IF NOT EXISTS feat_count INTEGER,
ADD COLUMN IF NOT EXISTS area DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS society VARCHAR(255),
ADD COLUMN IF NOT EXISTS society_id INTEGER,
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS dist_id INTEGER,
ADD COLUMN IF NOT EXISTS tehsil VARCHAR(100),
ADD COLUMN IF NOT EXISTS tehsil_id INTEGER,
ADD COLUMN IF NOT EXISTS mauza VARCHAR(100),
ADD COLUMN IF NOT EXISTS mauza_id INTEGER;

UPDATE public.society
SET
society_id = 1,
society = 'Chaharbagh Phase 1',
dist_id = 18,
district = 'Lahore',
tehsil_id = 16,
tehsil = 'Shalimar',
mauza_id = 1,
mauza = 'Handu Gujran'
WHERE gid = 1;

-- =====================================================
-- MASTERPLAN TABLE
-- =====================================================
ALTER TABLE public.masterplan
ADD COLUMN IF NOT EXISTS society_id INTEGER,
ADD COLUMN IF NOT EXISTS mauza_id INTEGER,
ADD COLUMN IF NOT EXISTS dist_id INTEGER,
ADD COLUMN IF NOT EXISTS tehsil_id INTEGER;
ADD COLUMN IF NOT EXISTS height double precision;

Run this query: 

UPDATE public.masterplan
SET
    society_id = 1,
    society = 'Chaharbagh Phase 1',
    dist_id = 18,
    district = 'Lahore',
    tehsil_id = 16,
    tehsil = 'Shalimar',
    mauza_id = 1,
    mauza = 'Handu Gujran';

UPDATE public.masterplan
SET height = CASE
WHEN land_use = 'Residential Plot' THEN 20
WHEN land_use = 'Commercial Plot' THEN 25
WHEN land_use = 'Green Belt' THEN 0
WHEN land_use = 'Barren Land' THEN 0
WHEN land_use = 'Road' THEN 2
WHEN land_use = 'Park' THEN 5
ELSE height
END;

-- =====================================================
-- SPOT LEVEL TABLE
-- =====================================================
ALTER TABLE public.spot_level
ADD COLUMN IF NOT EXISTS society_id INTEGER,
ADD COLUMN IF NOT EXISTS mauza_id INTEGER,
ADD COLUMN IF NOT EXISTS dist_id INTEGER,
ADD COLUMN IF NOT EXISTS tehsil_id INTEGER;

-- =====================================================
-- CONTOUR TABLE
-- =====================================================
ALTER TABLE public.contour
ADD COLUMN IF NOT EXISTS society_id INTEGER,
ADD COLUMN IF NOT EXISTS mauza_id INTEGER,
ADD COLUMN IF NOT EXISTS dist_id INTEGER,
ADD COLUMN IF NOT EXISTS tehsil_id INTEGER;

-- =======================================================================
-- FOR DATA IN SOCIETY, MASTERPLAN, SPOT LEVEL & CONTOUR TABLE
-- =======================================================================
UPDATE public.society
SET
society_id = 1,
society = 'Chaharbagh Phase 1',
dist_id = 18,
district = 'Lahore',
tehsil_id = 16,
tehsil = 'Shalimar',
mauza_id = 1,
mauza = 'Handu Gujran'
WHERE gid = 1;

UPDATE public.masterplan
SET
society_id = 1,
society = 'Chaharbagh Phase 1',
dist_id = 18,
district = 'Lahore',
tehsil_id = 16,
tehsil = 'Shalimar',
mauza_id = 1,
mauza = 'Handu Gujran';

UPDATE public.spot_level
SET
society_id = 1,
society = 'Chaharbagh Phase 1',
dist_id = 18,
district = 'Lahore',
tehsil_id = 16,
tehsil = 'Shalimar',
mauza_id = 1,
mauza = 'Handu Gujran';

UPDATE public.contour
SET
society_id = 1,
society = 'Chaharbagh Phase 1',
dist_id = 18,
district = 'Lahore',
tehsil_id = 16,
tehsil = 'Shalimar',
mauza_id = 1,
mauza = 'Handu Gujran';
