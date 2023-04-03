import { Box, Button, Flex, GridProps, HStack, Text, Tooltip, useColorModeValue, VStack } from "@chakra-ui/react"
import { PanelAdd } from "components/icons/PanelAdd"
import PageContainer from "layouts/page-container"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { Dashboard, DatasourceType, Panel, PanelType } from "types/dashboard"
import { requestApi } from "utils/axios/request"
import { Team } from "types/teams"
import DashboardHeader from "components/dashboard/DashboardHeader"
import DashboardGrid from "components/dashboard/grid/DashboardGrid"
import { cloneDeep } from "lodash"
import { TimeRange } from "types/time"
import { getInitTimeRange, initTimeRange } from "components/TimePicker"
import useVariables from "hooks/use-variables"
import { Variable } from "types/variable"

// All of the paths that is not defined in pages directory will redirect to this page,
// generally these pages are defined in:
// 1. team's side menu, asscessed by a specific url path
// 2. dashboard page, accessed by a dashboard id
const DashboardPage = () => {
    const router = useRouter()
    const dashboardId = router.query.dashboardId

    const [dashboard, setDashboard] = useState<Dashboard>(null)
    const [team, setTeam] = useState<Team>(null)
    // panel used for temporary purpose,such as adding a new panel, edit a panel etc
    const [panel, setPanel] = useState<Panel>(null)
    const [timeRange,setTimeRange] = useState<TimeRange>(getInitTimeRange())
    const [variables, setVariables] = useState<Variable[]>(null)
    useEffect(() => {
        if (dashboardId) {
            load()
        }
    }, [dashboardId])
    

    const load = async () => {
        const res = await requestApi.get(`/dashboard/byId/${dashboardId}`)
        setDashboard(res.data)

        const res0 = await requestApi.get(`/variable/all`)
        for (const v of res0.data) {
            v.values = v.value.split(",")
            if (v.values.length > 0) {
                v.selected = v.values[0]
            }
        }
        setVariables(res0.data)

        const res1 = await requestApi.get(`/team/${res.data.ownedBy}`)
        setTeam(res1.data)
    }

    const getNextPanelId = () => {
        let max = 0;
    
        for (const panel of dashboard.data.panels) {
          if (panel.id > max) {
            max = panel.id;
          }
        }
    
        return max + 1;
      }

    const onAddPanel = () => {
        // Return if the "Add panel" exists already
        // if (panel) {
        //     return;
        // }

        if (!dashboard.data.panels) {
            dashboard.data.panels = []
        }
        const id = getNextPanelId()
        const newPanel:Panel = {
            id: id,
            title: `New panel ${id}`,
            type: PanelType.Text,
            gridPos: { x: 0, y: 0, w: 12, h: 8 },
            settings: {
                text: {
                    md: `#Welcome to AiAPM\n This is a new panel\n You can edit it by clicking the edit button on the top title\n ###Have fun!`
                },
            },
            datasource: [{
                type: DatasourceType.Prometheus,
                selected: true,
                queryOptions: {
                    interval: '15s'   
                },
                queries: []
            }],
            useDatasource: false,
        }
        
        dashboard.data.panels.unshift(newPanel);

        // panel in editing must be a clone of the original panel
        setPanel(cloneDeep(newPanel))

        // scroll to top after adding panel
        window.scrollTo(0, 0);
    };

    const onEditPanelChange = () => {
        for (let i = 0; i < dashboard.data.panels.length; i++) {
            if (dashboard.data.panels[i].id === panel.id) {
                dashboard.data.panels[i] = panel
            }
        }
        // make the changes taking effect
        setDashboard(cloneDeep(dashboard))
    }

    const onEditPanelDiscard = () => {
        setPanel(null)
    }

    const onGridChange = (panel: Panel) => {
        // for (let i = 0; i < dashboard.data.panels.length; i++) {
        //     if (dashboard.data.panels[i].id === panel.id) {
        //         dashboard.data.panels[i] = panel
        //     }
        // }

        setDashboard(cloneDeep(dashboard))
    }


    console.log(dashboard)
    return (
        <>
        <PageContainer>
            {dashboard && <Box px="3" width="100%">
                <DashboardHeader dashboard={dashboard} team={team} onAddPanel={onAddPanel} onTimeChange={t => setTimeRange(t)} timeRange={timeRange}/>
                <Box mt="50px" py="2">
                    {dashboard.data.panels?.length > 0 && <DashboardGrid  dashboard={dashboard} onChange={onGridChange} timeRange={timeRange??getInitTimeRange()} variables={variables}/>}
                </Box>        
            </Box>}
        </PageContainer>
        </>
    )
}

export default DashboardPage



